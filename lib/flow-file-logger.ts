/*
const fs = require('fs');
const path = require('path');
const ansiRegex = require('ansi-regex');

const dpc = (delay:Function|number, fn:Function|number|undefined)=>{
	if(typeof delay == 'function')
		return setTimeout(delay as Function, (fn||0) as number);
	return setTimeout(fn as Function, delay||0);
}


// const MAX_LOG_FILE_SIZE = 50 * 1014 * 1024
class FlowFileLogger {


    //var self:any = this;
    file:string;
    logIntervalTime:number;
    logFilesCount:number;
    newFile:string;
    fileDate:Date;
    folderPath:string;
    ansiRegex_:any;
    flag:boolean;
    running:boolean;
    timeout_:any;
    interval_:any;


    constructor(options:any) {
        this.file = options.filename;

        this.logIntervalTime = options.logIntervalTime || 24 * 60 * 60;
        this.logFilesCount   = options.logFilesCount || 7;
        this.newFile     = '';
        this.fileDate    = new Date();
        this.folderPath  = '';
        this.ansiRegex_ = ansiRegex();
        this.flag = false;
        this.running = true;
    
        this.buildNewFileName();


        var d = new Date();

        if (options.testingMode){
            d.setSeconds(d.getSeconds()+20);
        }else{
            d.setHours(23);
            d.setMinutes(59);
            d.setSeconds(59);
        }
    
        var d2      = new Date();
        var diff    = d.getTime()-d2.getTime();
        var fullDayMilliSeconds = 24 * 60 * 60 * 1000;
        if (diff < 0) {
            diff = fullDayMilliSeconds + diff;
        };
    
        this.timeout_ = setTimeout(() => {
            clearTimeout(this.timeout_);
            console.log('log rotation :'.red.bold,(file||'').bold, new Date());
            flag        = true;
            this.interval_ = setInterval(()=>{
                flag        = true;
            }, logIntervalTime * 1000);
        }, diff)

    }


    write(text:string) {
        if(!options.ansi)
            text = (text||'').toString().replace(ansiRegex_,'');
        if( this.flag ){
            this.flag = false;
            this.copyFile(()=>{
                this.writeLog(text);
            });
            return;
        }
        this.writeLog(text);
    }

    halt() {
        if(!this.running)
            return;
        this.running = false;
        if(this.timeout_)
            clearTimeout(this.timeout_);
        if(this.interval_)
            clearInterval(this.interval_);
    }


    writeLog(text){
        try {
            fs.appendFileSync(file, text);
        } catch(ex) { console.log("Logger unable to append to log file:", file); }
    }

    buildNewFileName() {
        var parts = file.split('/');
        var filename = parts.pop();
        var ext = filename.split('.');
        if (ext.length > 1) {
            ext = '.'+ext[ext.length-1];
        }else{
            ext = '';
        }
        folderPath = parts.join('/');

        newFile = 'L-$$$'+ext;
    }

    copyFile(callback:any) {
        fs.readFile(file, (err:any, data:any) => {
            if (err)
                return callback();

            var fName = this.newFile.replace('$$$', utils.getTS(this.fileDate).replace(/:/g, '-').replace(" ", "_") );
            fs.writeFile( path.join(this.folderPath, '/', fName), data, (err:any, success:any)=>{
                if (err)
                    return callback();

                this.fileDate = new Date();
                fs.writeFile(this.file, '', ()=>{
                    callback();

                    var cmd = 'gzip "'+fName+'"';
                    exec(cmd, {cwd: folderPath}, (error, stdout, sterr) => {
                        console.log(('gzip'.green)+':', cmd, "result:", arguments);
                        try {
                            removeOldLogs();
                        } catch(ex) {
                            console.log("error removing past logs -",ex);
                        }
                    });
                });
            });
        });
    }

    removeOldLogs() {
        let files:any[] = [];
        function done(a?:any){
            var fLength = files.length;
            if ( fLength <= logFilesCount)
                return;

            files = _.sortBy(files, function(c){ return c.t;});
            for(var i = 0; i < (fLength - this.logFilesCount); i++){
                fs.unlinkSync(files[i].file);
            }
        }

        fs.readdir(this.folderPath, function(err:any, list:any) {
            if (err)
                return done(err);

            var pending = list.length;
            if (!pending)
                return done();

            list.forEach(function(file:string) {
                if (file.indexOf('L-')!==0){
                    if (!--pending)
                        done();
                    return;
                }

                file = folderPath + '/' + file;
                fs.stat(file, function(err:any, stat:any) {
                    if (stat) {
                        files.push({file: file, t: stat.ctime.getTime()})
                    }
                    if (!--pending)
                        done();
                });
            });
        });
    }
}


module.exports = { FlowBasicLogger };
*/