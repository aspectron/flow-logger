const fs = require('fs');
const path = require('path');
const ansiRegex = require('ansi-regex');

const dpc = (delay, fn)=>{
	if(typeof delay == 'function')
		return setTimeout(delay, fn||0);
	return setTimeout(fn, delay||0);
}


// const MAX_LOG_FILE_SIZE = 50 * 1014 * 1024
const FlowBasicLogger = function(options) {
    var self = this;
    var file = options.filename;

    var logIntervalTime = options.logIntervalTime || 24 * 60 * 60;
    var logFilesCount   = options.logFilesCount || 7;
    var newFile     = '';
    var fileDate    = new Date();
    var folderPath  = '';
    var ansiRegex_ = ansiRegex();

    buildNewFileName();

    var flag = false;
    self.write = (text) => {
        if(!options.ansi)
            text = (text||'').toString().replace(ansiRegex_,'');
        if( flag ){
            flag = false;
            copyFile(()=>{
                writeLog(text);
            });
            return;
        }
        writeLog(text);
    }

    let running = true;
    self.halt = () => {
        if(!running)
            return;
        running = false;
        if(this.timeout_)
            clearTimeout(this.timeout_);
        if(this.interval_)
            clearInterval(this.interval_);
    }

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

    function writeLog(text){
        try {
            fs.appendFileSync(file, text);
        } catch(ex) { console.log("Logger unable to append to log file:", file); }
    }

    function buildNewFileName(){
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

    function copyFile(callback){
        fs.readFile(file, (err, data) => {
            if (err)
                return callback();

            var fName = newFile.replace('$$$', utils.getTS(fileDate).replace(/:/g, '-').replace(" ", "_") );
            fs.writeFile( path.join(folderPath, '/', fName), data, (err, success)=>{
                if (err)
                    return callback();

                fileDate = new Date();
                fs.writeFile(file, '', ()=>{
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

    function removeOldLogs(){
        var files = [];
        function done(a){
            var fLength = files.length;
            if ( fLength <= logFilesCount)
                return;

            files = _.sortBy(files, function(c){ return c.t;});
            for(var i = 0; i < (fLength - logFilesCount); i++){
                fs.unlinkSync(files[i].file);
            }
        }

        fs.readdir(folderPath, function(err, list) {
            if (err)
                return done(err);

            var pending = list.length;
            if (!pending)
                return done();

            list.forEach(function(file) {
                if (file.indexOf('L-')!==0){
                    if (!--pending)
                        done();
                    return;
                }

                file = folderPath + '/' + file;
                fs.stat(file, function(err, stat) {
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