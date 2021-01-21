const utils = require('@aspectron/flow-utils');
const colors = require('colors');

interface PrefixId {
    [key: string] : number;
}

let prefix_ids = 0;
const prefixes:PrefixId = {
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

interface LevelToId {
    [key: string] : number;
}

interface LevelToColor {
    [key: string] : string;
}



class Levels {


    logger: FlowLogger;
    level_bits = 0;
    to_id: LevelToId = { };
    to_color: LevelToColor = { };
    levels_ui32_:number = 0;


    constructor(logger:FlowLogger) {
        this.logger = logger;
        this.level_bits = 0;
        this.to_id = { }
        this.to_color = { }
        this.levels_ui32_ = 0;
    }

    create(descriptor:[string,string]) {
        const { logger } = this;
        Object.entries(descriptor).forEach(([level, color]:[string,string]) => {
            this.to_id[level] = 1 << this.level_bits++;
            this.to_color[level] = color;
            if(level == 'trace')    // see FlowLogger::trace()
                return;
            this.logger[level] = (...args:any[]) => { logger.log_(level, ...args); }
            this.logger[level].trace = (...args:any[]) => {
                logger.log_(level, ...args);
                (new Error()).stack?.split('\n').slice(2).forEach(l=>logger.log_(level,l));
            }
        })
    }

    levels_to_ui32(levels:string[]) {
        return levels.reduce((v:number,l:string)=>v|this.to_id[l],0);
    }

    enable(levels:string|string[]) {
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

    disable(levels:string|string[]) {
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

declare type logfn = (args: any[]) => void;
//declare type tracefn = 

export class FlowLogger {

    [key:string] : any;
    levels: Levels;
    prefix_ui32:number;
    color_content:boolean;
    //[fn:string] : logfn;

    constructor(name:string, options_:Object) {
        const options = Object.assign({
            sink : null,                        // callback to receive messages
            levels : ['error','warn','info'],   // levels to enable by default
            display: ['level'],                 // part of the prefix to display: time|name|level
            custom : { },                       // custom log levels as { abc : 'cyan', def : 'blue } or ['abc:cyan','def:blue']
            color : ['name','level']            // component to color time|name|level|content
        }, options_||{});

        this.name = name;
        this.name_prefix_ = `[${name}]`;

        let custom:any = { }
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

        this.prefix = (level:string) => {
            const prefix = [];
            if(this.prefix_ui32 & time_prefix) {
                const ts = utils.getTS();
                prefix.push(prefix_color & time_prefix ? ts[level] : ts);
            }
            if(this.prefix_ui32 & name_prefix) {
                const p:string = (this.name_prefix_+((this.prefix_ui32 & level_prefix)?'':':'));
                prefix.push(prefix_color&name_prefix?p[level]:p);
            }
            if(this.prefix_ui32 & level_prefix) {
                const l:string = (level+':');
                prefix.push(prefix_color&level_prefix?l[level]:l);
            }
            return prefix;
        }
    }


    // digest(sink) {
    //     this.sink = sink;
    // }

    log_(level:string, ...args:any[]) {

        let id = this.levels.to_id[level];
        if(!(this.levels.levels_ui32_ & id))
            return;

        let prefix = this.prefix(level);

        if(this.color_content) {
            args = args.map((v:any[string])=>{
                return typeof v === 'string' ? v[level] : v;
            })
        }

        if(this.sink && !this.sink(...prefix, ...args))
            return;

        console.log(...prefix, ...args);
    }

    trace(...args:any[]) {
        this.log_('trace', ...args);
        (new Error()).stack?.split('\n').slice(2).forEach(l=>this.log_('trace',l));
        //.forEach(l=>this.log_(level,l));
    }
}

// module.exports = { FlowLogger };