const utils = {
    getTS(src_date){
        var d = src_date || (new Date());
        var year = d.getFullYear();
        var month = d.getMonth()+1; month = month < 10 ? '0' + month : month;
        var date = d.getDate(); date = date < 10 ? '0' + date : date;
        var hour = d.getHours(); hour = hour < 10 ? '0' + hour : hour;
        var min = d.getMinutes(); min = min < 10 ? '0' + min : min;
        var sec = d.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
        //var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
        return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
    }
}
//require('@aspectron/flow-utils');
//const colors = require('colors');
const colors = {
    setTheme(opt){
        console.log("opt", opt)
        Object.entries(opt).forEach(([level, color])=>{
            console.log("level, color", level, color)
            Object.defineProperty(String.prototype, level, {
                get(){
                    return "%c"+this;
                }
            })
            /*
            String.prototype[level] = function(){
                
            }
            */
        })
        
    }
}

let prefix_ids = 0;
const prefixes = {
  'time' : 1 << prefix_ids++,
  'name' : 1 << prefix_ids++,
  'level': 1 << prefix_ids++
}

const levels = {
    error: 'red',
    warn: 'magenta',
    info: 'white',
    verbose: 'yellow',
    network : 'blue',
    trace: 'grey',
    debug: 'green',
}

/*

Usage example:

const log = new FlowLogger('TestLogger', { display : ['name','level'], custom : ['levelA:cyan','levelB'], color: 'name level' });
log.levels.enable('levelA levelB');
log.info('info log');
log.info.trace('info trace');  // prints stack trace
log.levels.disable('all').enable('debug trace');
log.trace('trace test);
log.debug('debug test);

*/

class Levels {

    constructor(logger) {
        this.logger = logger;
        this.level_bits = 0;
        this.to_id = { }
        this.to_color = { }
        this.levels_ui32_ = 0;
    }

    create(descriptor) {
        const { logger } = this;
        Object.entries(descriptor).forEach(([level, color]) => {
            this.to_id[level] = 1 << this.level_bits++;
            this.to_color[level] = color;
            if(level == 'trace')    // see FlowLogger::trace()
                return;
            this.logger[level] = (...args) => { logger.log_(level, ...args); }
            this.logger[level].trace = (...args) => {
                logger.log_(level, ...args);
                (new Error()).stack.split('\n').slice(2).forEach(l=>logger.log_(level,l));
            }
        })
    }

    levels_to_ui32(levels) {
        return levels.reduce((v,l)=>v|this.to_id[l],0);
    }

    enable(levels) {
        if(levels == 'all') {
            this.levels_ui32_ = 0xffffffff;
            return this;
        }

        Object.entries(this.to_id).forEach(([l,bit]) => {
            if(levels.includes(l))
                this.levels_ui32_ |= bit;
        })

        return this;
    }

    disable(levels) {
        if(levels == 'all') {
            this.levels_ui32_ = 0x00000000;
            return this;
        }

        Object.entries(this.to_id).forEach(([l,bit]) => {
            if(levels.includes(l))
                this.levels_ui32_ &= ~bit;
        })

        return this;
    }
}

class FlowLogger {

    constructor(name, options_) {
        const options = Object.assign({
            sink : null,                        // callback to receive messages
            levels : ['error','warn','info'],   // levels to enable by default
            display: ['level'],                 // part of the prefix to display: time|name|level
            custom : { },                       // custom log levels as { abc : 'cyan', def : 'blue } or ['abc:cyan','def:blue']
            color : ['name','level']            // component to color time|name|level|content
        }, options_||{});

        this.name = name;
        this.name_prefix_ = `[${name}]`;

        let custom = { }
        if(Array.isArray(options.custom))
            options.custom.forEach(l=>{
                let [level,color] = l.split(':');
                custom[level]=color||'white';
            });
        else
            custom = options.custom;


        this.levels = new Levels(this);
        this.levels.create({
            ...levels,
            ...custom
        });
        this.levels.enable(options.levels);

        if(options.color)
            colors.setTheme(this.levels.to_color);

        this.prefix_ui32 = options.display.reduce((v,l)=>v|prefixes[l],0);

        let prefix_color = 0;
        Object.entries(prefixes).forEach(([prefix,bit]) => {
            if(options.color.includes(prefix) || options.color.includes('prefix') || options.color.includes('all'))
                prefix_color |= bit;
        })
        this.color_content = options.color.includes('content') || options.color.includes('all');
        //console.log(options.color, prefix_color);
        const { time : time_prefix, name : name_prefix, level : level_prefix } = prefixes;

        this.prefix = (level) => {
            const prefix = [], colors=[], color = this.levels.to_color[level];
            if(this.prefix_ui32 & time_prefix) {
                const ts = utils.getTS();
                if(prefix_color & time_prefix){
                    prefix.push(ts[level]);
                    colors.push(color)
                }else{
                    prefix.push('%c'+ts);
                    colors.push('')
                }
            }
            if(this.prefix_ui32 & name_prefix) {
                const p = (this.name_prefix_+((this.prefix_ui32 & level_prefix)?'':':'));
                if(prefix_color & name_prefix){
                    prefix.push(p[level]);
                    colors.push(color)
                }else{
                    prefix.push('%c'+p);
                    colors.push('')
                }
            }
            if(this.prefix_ui32 & level_prefix) {
                const l = (level+':');
                if(prefix_color & level_prefix){
                    prefix.push(l[level]);
                    colors.push(color)
                }else{
                    prefix.push('%c'+l);
                    colors.push('')
                }
            }
            if(this.color_content){
                colors.push(color)
            }else{
                colors.push('')
            }
            return {prefix, colors};
        }
    }


    digest(sink) {
        this.sink = sink;
    }

    log_(level, ...args) {

        let id = this.levels.to_id[level];
        if(!(this.levels.levels_ui32_ & id))
            return;

        let {prefix, colors} = this.prefix(level);

        /*if(this.color_content) {
            args = args.map(v=>{
                return typeof v === 'string' ? v[level] : v;
            })
        }*/
        if(this.sink && !this.sink(...prefix, ...args))
            return;
        
        colors = colors.map(color=>color?`color:${color}`:'color:white')
        console.log("text, colors", [...prefix, ...args], colors)
        console.log([...prefix, "%c", ...args].join(" "), ...colors);
    }

    trace(...args) {
        this.log_('trace', ...args);
        (new Error()).stack.split('\n').slice(2).forEach(l=>this.log_('trace',l));
        //.forEach(l=>this.log_(level,l));
    }
}

module.exports = { FlowLogger };