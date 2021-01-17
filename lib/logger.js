const utils = require('@aspectron/flow-utils');
const colors = require('colors');
let { levels, colors : theme } = require('./log-types');
colors.setTheme(theme);
let ucl_ = { }
let len = 0;
const levels_list = Object.keys(levels); // .forEach(l=>ucl_[l]=l.toUpperCase());
levels_list.forEach(l=>{ if(len<l.length) len = l.length; });
let levels_padded = { }
levels_list.forEach(l=>levels_padded[l] = l.padStart(len));

class FlowLogger {

    static levels = levels;

    constructor(name, level, options_ = {}) { //name, level = levels.info) {
        const options = Object.assign({
            sink : null,        // external consumer callback
            time : false,       // display timestamp
            name: true,         // display name
            level : false,      // display log level type
            color : 'prefix'    // color prefix only
        }, options_);
        this.name = name;
        this.level = level;
        this.name_prefix_ = `[${name}]`;
        this.color_prefix = options.color == 'prefix' || options.color == 'all';
        this.color_output = options.color == 'all';

        this.prefix = (level) => {

            const prefix = [];
            if(options.time) {
                const ts = utils.getTS();
                prefix.push(ts);//this.color_prefix?ts[level]:ts);
            }
            if(options.name) {
                const p = (this.name_prefix_+(options.level?'':':'));
                prefix.push(this.color_prefix?p[level]:p);
            }
            if(options.level) {
                const l = (levels_padded[level]+':');
                prefix.push(this.color_prefix?l[level]:l);
            }
            return prefix;
        }
    }

    digest(sink) {
        this.sink = sink;
    }

    log(level)

    log_(level, ...args) {
        if(levels[level] > levels[this.level])
            return;

        let prefix = this.prefix(level);

        if(this.color_output) {
            args = args.map(v=>{
                return typeof v === 'string' ? v[level] : v;
            })
        }

        if(this.sink && !this.sink(...prefix, ...args))
            return;

        console.log(...prefix, ...args);
    }
}

Object.keys(levels).forEach(level => {
    FlowLogger.prototype[level] = function(...args) {
        this.log(level, ...args);
    }
});

module.exports = { FlowLogger };