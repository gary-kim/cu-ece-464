#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import nodeEval from 'node-eval';
import { MongoClient } from 'mongodb';
import { JSDOM } from 'jsdom';

program
    .requiredOption("-d, --mongodb <url>", `MongoDB database url (example: "mongodb://root:password@127.0.0.1")`)
    .command("fetch")
    .description("Fetch data from weather.gov website and place it into database")
    .action(fetch);

program
    .command("get-sensor")
    .argument("<lid>", "Sensor ID")
    .description("Get sensor by its sensor ID")
    .action(get_sensor_by_lid);

program
    .command("list-status-colors")
    .description("List available sensors statuses and their corresponding indication color")
    .action(get_color_choices);

program
    .command("get-sensors-in-status")
    .argument("<status-code-or-name>", "The status code or name to search for (Status code may either be the specific color code of the status or a substring of the status description)")
    .description("List all sensors that are in a specific status. (Status code may either be the specific color code of the status or a substring of the status description)")
    .action(get_sensors_in_status);

program
    .command("get-sensors-in-state")
    .argument("<state-code>", "The state code")
    .description("List all sensors that are in a specific state")
    .action(get_sensors_in_state);

const cmd_count = program.command("count")
    .description("subcommands for counting sensors");

cmd_count
    .command("sensors-in-state")
    .argument("<state-code>", "The state code to search for")
    .description("Count all sensors that are in a specific state (Must be a valid state code)")
    .action(count_sensors_in_state);

cmd_count
    .command("sensors-in-status")
    .argument("<status-color-or-name>", "The status code or name to search for (Status code may either be the specific color code of the status or a substring of the status description)")
    .description("List all sensors that are in a specific status. (Status code may either be the specific color code of the status or a substring of the status description)")
    .action(count_sensors_by_status);

let mg = null;

async function get_mongo_db () {
    if (mg)
        return mg.db("464");

    mg = new MongoClient(program.opts().mongodb);

    console.error("Connecting to MongoDB")
    await mg.connect();
    console.error("Connected to MongoDB");
    return mg.db("464");
}

async function get_mongo_river_data_collection () {
    return (await get_mongo_db()).collection("river_data");
}

async function get_mongo_color_choices_collection () {
    return (await get_mongo_db()).collection("color_choices");
}

async function fetch (opts) {
    const collection = await get_mongo_river_data_collection();
    const color_choices_collection = await get_mongo_color_choices_collection();

    const res = await axios.get("https://water.weather.gov/ahps/index.php", {
        headers: {
            "Accept-Encoding": "",
        }
    });

    const page_dom = new JSDOM(res.data);
    // Get the list of available colors and their names
    const colors = Array.from(page_dom.window.document.querySelectorAll("a.changeColor")).filter(e => e.parentElement.classList.contains("small")).map(e => ({
        color: e.getAttribute("href"),
        name: e.parentElement.textContent.trim().substring(2),
    }));

    Promise.all(colors.map(color => {
        return color_choices_collection.replaceOne({
                color: color.color,
            },
            color,
            {
                upsert: true,
            }
        );
    }));

    let key_array_line = res.data.split("\n").filter(d => d.includes("key_array"))[0].substring(1);
    const key_array = nodeEval(key_array_line + "; key_array");

    const info_fetch_promises = key_array.map(fetch_info_with_key);
    const responses = await Promise.all(info_fetch_promises);

    await Promise.all(responses.map(async r => {
        if (!r.points) {
            console.error("cannot find points for", r);
            return;
        }
        await Promise.all(r.points.map(async p => {
            const to_put = JSON.parse(JSON.stringify(p));
            // Make hsa_display an embedded document instead of a string
            to_put.hsa_display = JSON.parse(to_put.hsa_display);
            await collection.replaceOne(
                {
                    lid: p.lid,
                },
                to_put,
                {
                    upsert: true,
                }
            );
        }))
    }));

    console.log("Completed fetching data and inserting into database");
    process.exit(0);
}

async function fetch_info_with_key (key) {
    console.log(`Making request for key ${key}`);
    const res = await axios.post("https://water.weather.gov/ahps/get_map_points.php", {
        key,
        fcst_type: "obs",
        percent: "",
        current_type: "all",
        populate_viewport: "0",
    }, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "",
        }
    });

    console.log(`Completed request for ${key}`);

    if (res.status !== 200) {
        console.error(`Request failed for key ${key}`);
        console.error(res.errorText);
        process.exit(1);
    }

    return res.data;
}

async function count_sensors_in_state (state) {
    const collection = await get_mongo_river_data_collection();

    state = state.toUpperCase();

    const num_sensors = await collection.countDocuments({state: state});
    if (num_sensors === 0) {
        console.error(`Cannot find any sensors available in "${state}". Is "${state}" a valid state code?`);
        process.exit(1);
    }
    console.log(`There are ${num_sensors} sensors available in "${state}"`);
    process.exit(0);
}

async function get_sensors_in_state (state) {
    const collection = await get_mongo_river_data_collection();

    state = state.toUpperCase();

    const num_sensors = await collection.countDocuments({state: state});
    if (num_sensors === 0) {
        console.error(`Cannot find any sensors available in "${state}". Is "${state}" a valid state code?`);
        process.exit(1);
    }

    const sensors = await collection.find({state: state}).toArray();
    console.log(`The following sensors are in "${state}" state:`);
    sensors.forEach(e => console.log(`lid: ${e.lid} | name: ${e.name}`));
    process.exit(1);
}

async function status_to_color (status_color_cased) {
    const color_choices_collection = await get_mongo_color_choices_collection();

    const status_color = status_color_cased.toLowerCase();

    let status = (await color_choices_collection.find({color: status_color}).toArray())[0];
    if (!status) {
        const query = {
            name: {
                $regex: status_color,
                $options: "i"
            },
        };
        let num_options = await color_choices_collection.count({name: {$regex: status_color, $options: "i"}});
        if (num_options === 1) {
            status = (await color_choices_collection.find(query).toArray())[0];
        } else if (num_options > 1) {
            console.error(`Given status ${status_color_cased} is ambigous. Are you looking for one of these?`);
            console.error();
            (await color_choices_collection.find(query).toArray()).map(e => e.name).forEach(e => console.error(`"${e}"`))
            process.exit(1);
        }
    }
    if (!status) {
        console.error(`${status_color} status does not exist`);
        process.exit(1);
    }
    return status;
}

async function count_sensors_by_status (status_color) {
    const collection = await get_mongo_river_data_collection();
    const status = await status_to_color(status_color);

    const num_sensors = await collection.countDocuments({obs_status: status.color});

    console.log(`There are ${num_sensors} in "${status.name}" (${status.color}) status`);
    process.exit(0);
}

async function get_sensors_in_status (status_code) {
    const collection = await get_mongo_river_data_collection();
    const status = await status_to_color(status_code);

    const sensors = await collection.find({obs_status: status.color}).toArray();
    console.log(`The following sensors are in "${status.name}" (${status.color}) status:`);
    sensors.forEach(e => console.log(`lid: ${e.lid} | name: ${e.name}`));
    process.exit(0);
}

async function get_sensor_by_lid (lid) {
    const collection = await get_mongo_river_data_collection();

    lid = lid.toLowerCase();

    let sensor = await collection.find({lid: lid});
    if (!sensor) {
        console.error(`Cannot find sensor with lid ${lid}`);
        process.exit(1);
    }
    sensor = (await sensor.toArray())[0];
    if (!sensor) {
        console.error(`Cannot find sensor with lid ${lid}`);
        process.exit(0);
    }
    console.log(`Sensor with lid ${lid}:`);
    console.log(sensor);
    process.exit(0);
}

async function get_color_choices () {
    const color_choices_collection = await get_mongo_color_choices_collection();
    if ((await color_choices_collection.estimatedDocumentCount()) === 0) {
        console.error("Database is empty! Try using fetch!");
        process.exit(1);
    }
    const cursor = color_choices_collection.find();

    await cursor.forEach(color => {
       console.log(`${color.color} | ${color.name}`);
    });
    process.exit(0);
}

program.parse()
