import * as assert from "assert";
import {Boats, Reserves, Sailors} from "./db.js";
import sequelize, {Op} from "sequelize";

describe("Reimplemented Part 1 for Part 2", function () {
    it("List, for every boat, the number of times it has been reserved, excluding those boats that have never been reserved (list the id and the name).", async function() {
        const boats = await Boats.findAll({
            attributes: {
                include: [[sequelize.fn("COUNT", sequelize.col("*")), "count"]]
            },
            include: [{
                model: Reserves,
                attributes: [],
            }],
            group: ["boats.bid"],
        });

        // expected is bid => count
        const expected = {
            "101": 2,
            "102": 3,
            "103": 3,
            "104": 5,
            "105": 3,
            "106": 3,
            "109": 4,
            "112": 1,
            "110": 3,
            "107": 1,
            "111": 1,
            "108": 1,
        };

        Object.keys(expected).forEach(key => {
            assert.equal(boats.find(b => b.bid.toString() === key).dataValues.count, expected[key], `Reserves count incorrect for sid ${key}`);
        });
    });

    it("List those sailors who have reserved every red boat (list the id and the name).", async function () {
        const redBoats = await Boats.findAll({
            where: {
                color: "red",
            },
            include: Reserves,
        });

        // Expected sids
        const expected = [22, 23, 24, 31, 35, 59, 61, 62, 64, 88, 89];
        let gotten = [];

        await Promise.all(redBoats.map(async boat => {
            const sailors =  await Promise.all(boat.reserves.map(r => r.getSailor()));
            sailors.forEach(ss => {
                if (!gotten.includes(ss.sid))
                    gotten.push(ss.sid);
            })
        }));

        assert.deepEqual(gotten.sort(), expected.sort(), "List of sids do not match");
    });

    it("List those sailors who have reserved only red boats.", async function() {
        const sailors = await Sailors.findAll();
        const finalSailors = [];
        const expected = [23, 24, 35, 61, 62];

        await Promise.all(sailors.map(async sailor => {
            const reservations = await sailor.getReserves();

            if (reservations.length === 0)
                return;
            let colors = await Promise.all(reservations.map(async res => (await res.getBoat()).color))
            if (!colors.every(e => e === "red"))
                return;
            finalSailors.push(sailor.sid);
        }));

        assert.deepEqual(finalSailors.sort(), expected.sort());
    });

    it("For which boat are there the most reservations?", async function() {
        const boats = await Boats.findAll();
        const info = await Promise.all(boats.map(async b => ({ boat: b, count: await b.countReserves() })));

        const maxBoat = info.reduce((p, c) => c.count > p.count ? c : p, { count: 0 });

        assert.equal(maxBoat.boat.bid, 104);
    })

    it("Select all sailors who have never reserved a red boat.", async function() {
        const sailors = await Sailors.findAll({
            include: [{
                model: Reserves,
                include: [{
                    model: Boats,
                    attributes: ["color"],
                }],
            }],
        });

        const noRedSailors = sailors.filter(sailor => sailor.reserves.every(r => r.boat.color !== "red"));
        const sids = noRedSailors.map(sailor => sailor.sid);
        const expected = [29, 32, 58, 60, 71, 74, 85, 90, 95];

        assert.deepEqual(sids.sort(), expected.sort());
    });

    it("Find the average age of sailors with a rating of 10.", async function() {
       const rating10Sailors = await Sailors.findAll({
           where: {
               rating: 10,
           },
       });

       const avg = rating10Sailors.map(s => s.age).reduce((p, c) => p + c, 0) / rating10Sailors.length;
       assert.equal(avg, 35);
    });

    it("For each rating, find the name and id of the youngest sailor.", async function() {
       const sailors = await Sailors.findAll();
       const rating2sailor = {};
       sailors.forEach(sailor => {
           if (!rating2sailor[sailor.rating] || rating2sailor[sailor.rating].age > sailor.age)
               rating2sailor[sailor.rating] = sailor;
       });

       // rating -> age
       const expected = {
           "1": 33,
           "3": 25,
           "7": 16,
           "8": 25,
           "9": 25,
           "10": 35,
       };

       Object.keys(rating2sailor).forEach(key => {
           assert.equal(rating2sailor[key].age, expected[key]);
       });
    });

    it("Select, for each boat, the sailor who made the highest number of reservations for that boat.", async function() {
        const boats = await Boats.findAll({
            include: {
                model: Reserves,
            }
        });

        const b2s = {};
        boats.forEach(b => {
            if (b.reserves.length === 0)
                return;
            const sid = {};
            b.reserves.forEach(res => {
                sid[res.sid] = (sid[res.sid] || 0) + 1;
            });
            const keys = Object.keys(sid);
            let maxReservationsSid = keys[0];
            let maxReservations = sid[keys[0]];
            for(let i = 1; i < keys.length; i++) {
                if (sid[keys[i]] > maxReservations) {
                    maxReservationsSid = keys[i];
                    maxReservations = sid[keys[i]];
                }
            }
            b2s[b.bid] = maxReservationsSid;
        })

        assert.equal(Object.keys(b2s).length, 12);
    });
});
