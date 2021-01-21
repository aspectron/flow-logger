declare module '@aspectron/flow-logger' {
	type Colorable = 'time'|'name'|'level'|'content';
	type Displayable = 'time'|'name'|'level';
	interface FlowLoggerOptions{
 		sink? : Function,     // callback to receive messages
        levels? : string[],   // levels to enable by default
        display? : Displayable[],   // part of the prefix to display: time|name|level
        custom? : Record<string, string>|string[], // custom log levels as { abc : 'cyan', def : 'blue } or ['abc:cyan','def:blue']
        color? : Colorable[] // component to color time|name|level|content
	}

	class Levels{
		enable(level:string):void;
		disable(level:string):void;
	}

	class FlowLogger{
		constructor(name:string, options:FlowLoggerOptions)
		error(...args: any[]):void;
		warn(...args: any[]):void;
		info(...args: any[]):void;
		verbose(...args: any[]):void;
		network(...args: any[]):void;
		trace(...args: any[]):void;
		debug(...args: any[]):void;

		setLevel(level:string):void;
		levels:Levels;
	}
}
