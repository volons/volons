const log = {
    info: function(msg, meta) {
        console.log(msg, meta);
    },
    warn: function(msg, meta) {
        console.warn(msg, meta);
    },
    error: function(msg, meta) {
        console.error(msg, meta);
    },
};

module.exports = log;
