import Colors = require('colors.ts'); //

// @ts-ignore
const isNode = typeof process === "object" && `${process}` === "[object process]";

function colors(text:string, color:string) {
    return Colors.colors(color,text);
    // console.log("%cThis is a green text", "color:green");
}

function theme(theme: { [key: string]: string; }) {
    Colors.theme(theme);
}

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

interface LogLevelToId { [key: string] : number; }
interface LogLevelToColor { [key: string] : string; }
declare type SinkFn = (obj: any) => boolean;

export class FlowLogger {

    [key:string] : any;
//    levels: Levels;
    prefix_ui32:number;
    color_content:boolean;
//    logger: FlowLogger;
    level_bits:number;
    to_id: LogLevelToId;
    to_color: LogLevelToColor;
    levels_ui32_:number;
    sink:SinkFn|null;

    //[fn:string] : logfn;

    static getTS():string {
        let d:Date = (new Date());
        let year:string|number = d.getFullYear();
        let month:string|number = d.getMonth()+1; month = month < 10 ? '0' + month : month;
        let date:string|number = d.getDate(); date = date < 10 ? '0' + date : date;
        let hour:string|number = d.getHours(); hour = hour < 10 ? '0' + hour : hour;
        let min:string|number = d.getMinutes(); min = min < 10 ? '0' + min : min;
        let sec:string|number = d.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
        //var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
        return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
    }


    constructor(name:string, options_:Object={}) {
        const options = Object.assign({
            sink : null,                        // callback to receive messages
            levels : ['error','warn','info'],   // levels to enable by default
            display: ['level'],                 // part of the prefix to display: time|name|level
            custom : { },                       // custom log levels as { abc : 'cyan', def : 'blue } or ['abc:cyan','def:blue']
            color : ['name','level']            // component to color time|name|level|content
        }, options_);

        this.name = name;
        this.name_prefix_ = `[${name}]`;

        this.level_bits = 0;
        this.to_id = { }
        this.to_color = { }
        this.levels_ui32_ = 0;

        let custom:any = { }
        if(Array.isArray(options.custom))
            options.custom.forEach(l=>{
                let [level,color] = l.split(':');
                custom[level]=color||'white';
            });
        else
            custom = options.custom;

        this.sink = options.sink;

        this.create({
            ...levels,
            ...custom
        }).enable(options.levels);

        if(options.color)
            //colors.
            theme(this.to_color);

        this.prefix_ui32 = options.display.reduce((v,l)=>v|prefixes[l],0);

        let prefix_color = 0;
        Object.entries(prefixes).forEach(([prefix,bit]) => {
            if(options.color.includes(prefix) || options.color.includes('prefix') || options.color.includes('all'))
                prefix_color |= bit;
        })
        this.color_content = options.color.includes('content') || options.color.includes('all');
        //console.log(options.color, prefix_color);
        const { time : time_prefix, name : name_prefix, level : level_prefix } = prefixes;


        this.prefix = (level:string, ts:string) => {
            const prefix = [];
            if(this.prefix_ui32 & time_prefix) {
                prefix.push(prefix_color & time_prefix ? colors(ts,level) : ts);
            }
            if(this.prefix_ui32 & name_prefix) {
                const p:string = (this.name_prefix_+((this.prefix_ui32 & level_prefix)?'':':'));
                prefix.push(prefix_color&name_prefix?colors(p,level):p);
            }
            if(this.prefix_ui32 & level_prefix) {
                const l:string = (level+':');
                prefix.push(prefix_color&level_prefix?colors(l,level):l);
            }
            return prefix;
        }
    }


    create(descriptor:[string,string]) {
        Object.entries(descriptor).forEach(([level, color]:[string,string]) => {
            this.to_id[level] = 1 << this.level_bits++;
            this.to_color[level] = color;
            if(level == 'trace')    // see FlowLogger::trace()
                return;
            this[level] = (...args:any[]): FlowLogger => { return this.log_(level, ...args); }
            this[level].trace = (...args:any[]): FlowLogger => {
                this.log_(level, ...args);
                (new Error()).stack?.split('\n').slice(2).forEach(l=>this.log_(level,l));
                return this;
            }
        })
        return this;
    }

    levels_to_ui32(levels:string[]) {
        return levels.reduce((v:number,l:string)=>v|this.to_id[l],0);
    }

    enable(levels:string|string[]):FlowLogger {
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

    disable(levels:string|string[]):FlowLogger {
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

    // digest(sink) {
    //     this.sink = sink;
    // }

    log_(level:string, ...args:any[]): FlowLogger {

        let id = this.to_id[level];
        if(!(this.levels_ui32_ & id))
            return this;

        const ts = FlowLogger.getTS();
        const prefix = this.prefix(level, ts);

        if(this.color_content) {
            args = args.map((v:any[string])=>{
                return typeof v === 'string' ? colors(v,level) : v;
            })
        }

        if(this.sink && !this.sink({ts,level,args}))
            return this;

        console.log(...prefix, ...args);

        return this;
    }

    trace(...args:any[]) {
        this.log_('trace', ...args);
        (new Error()).stack?.split('\n').slice(2).forEach(l=>this.log_('trace',l));
        //.forEach(l=>this.log_(level,l));
    }
}
