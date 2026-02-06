const repo = require("./doctors.repository");

exports.getAllDoctors = async () => {
    return await repo.getAllDoctors();
};
