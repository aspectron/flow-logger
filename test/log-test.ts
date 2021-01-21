import  { FlowLogger }  from '../lib/flow-logger'


let log = new FlowLogger('TS', { custom : ['utxo:blue']});

log.enable('utxo');
log.error('hello world');
log.utxo('hello world');