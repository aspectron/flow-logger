
const { FlowLogger} = require('../');

const log = new FlowLogger('FlowHttp', { 
    display : ['name','level'], 
    custom : ['utxo:cyan','tx'], 
    color: 'name level' 
});

log.levels.enable('tx');

log.debug('hello debug');
log.info('hello info');
log.warn('hello warn');
log.error('hello error');
log.verbose('hello verbose');
log.debug('hello debug');
log.utxo('hello utxo');
log.tx('hello tx');

log.levels.disable('all').enable('verbose,info,error,trace,utxo');

console.log('----------------');

log.debug('hello debug');
log.info('hello info');
log.warn('hello warn');
log.error('hello error');
log.verbose('hello verbose');
log.debug('hello debug');
log.utxo('hello utxo');
log.tx('hello tx');

log.trace('hello trace');
log.error.trace('hello error trace');

