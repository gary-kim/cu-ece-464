import { Command } from "commander";
import {Sailors, Boats, Reserves, ContactInfo} from "./db.js";

const program = new Command();

program
    .command("add-contact-info <sid> <type> <info>")
    .description("type should be 0: phone, 1: email, 2: street address")
    .action(add_contact_info);

program
    .command("get-contact-info <sid>")
    .action(get_contact_info);

program
    .command("add-license <sid> <origin> <info>")
    .action(add_license);

program
    .command("get-license <sid>")
    .action(get_license);

program.parse(process.argv);

async function add_contact_info (sid, type, info, cmd) {
    const sailor = await Sailors.findByPk(sid);

    const contactInfo = await Sailors.createContactInfo({
        type,
        info,
        active: true,
    });
}

async function get_contact_info (sid, cmd) {
    const sailor = await Sailors.findByPk(sid);

    const contactInfo = await sailor.getContactInfos();
    console.log(contactInfo.map(c => c.dataValues));
}

async function get_license (sid, cmd) {
    const sailor = await Sailors.findByPk(sid);

    const licenses = await sailor.getLicenses();
    console.log(licenses.map(l => l.dataValues));
}

async function add_license (sid, license, origin, cmd) {
    const sailor = await Sailors.findByPk(sid);

    await sailor.createLicense({
        license,
        licenseOrigin: origin,
    });
}
