const { FlowBasicLogger } = require("./lib/basic-file-logger");
const { FlowLogger } = require("./lib/logger");
const { colors, levels } = require("./lib/log-types");
module.exports = { FlowBasicLogger, FlowLogger, colors, levels };
