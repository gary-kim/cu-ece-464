import { Sequelize, Model, DataTypes } from 'sequelize';

const sequelize = new Sequelize('ece464', "user", "password", {
    dialect: "mysql",
    define: {
        timestamps: false,
    }
});

const Boats = sequelize.define('boats', {
    bid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    bname: DataTypes.STRING(20),
    color: DataTypes.STRING(10),
    length: DataTypes.INTEGER,
});

const Sailors = sequelize.define('sailors', {
    sid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    sname: DataTypes.STRING(30),
    rating: DataTypes.INTEGER,
    age: DataTypes.INTEGER,
});

const Reserves = sequelize.define('reserves', {
    sid: {
        type: DataTypes.INTEGER,
        references: {
            model: Sailors,
            key: 'sid',
        },
        primaryKey: true,
    },
    bid: {
        type: DataTypes.INTEGER,
        references: {
            model: Boats,
            key: 'bid',
        },
        primaryKey: true,
    },
    day: {
        type: DataTypes.DATE,
        primaryKey: true,
    },
});

Boats.hasMany(Reserves, { foreignKey: "bid" });
Sailors.hasMany(Reserves, { foreignKey: "sid" });

Reserves.belongsTo(Sailors, { foreignKey: "sid" });
Reserves.belongsTo(Boats, { foreignKey: "bid" });

// Work for Part 3 underneath

const Licenses = sequelize.define('Licenses', {
    sid: {
        type: DataTypes.INTEGER,
        references: {
            model: Sailors,
            key: 'sid',
        },
    },
    license: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    licenseOrigin: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
});

Sailors.hasMany(Licenses, { foreignKey: "sid" });
Licenses.belongsTo(Sailors, { foreignKey: "sid" });

const CONSTANTS = {
    CONTACT_TYPE: {
        PHONE: 0,
        EMAIL: 1,
        MAILING_ADDRESS: 2,
    },
};

const ContactInfo = sequelize.define("ContactInfo", {
    cid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    sid: {
        type: DataTypes.INTEGER,
        references: {
            model: Sailors,
            key: 'sid',
        },
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    type: {
        type: DataTypes.INTEGER,
        validate: {
            isIn: [Object.values(CONSTANTS.CONTACT_TYPE)],
        },
    },
    info: {
        type: DataTypes.STRING,
    },
});

ContactInfo.belongsTo(Sailors, { foreignKey: "sid" });
Sailors.hasMany(ContactInfo, { foreignKey: "sid" });

await sequelize.sync();

export {
    Boats,
    Sailors,
    Reserves,
    ContactInfo,
    CONSTANTS,
}
