const test = require('node:test');
const assert = require('node:assert/strict');
const { TuneViva } = require('../dist/nodes/TuneViva/TuneViva.node.js');
const node = new TuneViva();
function context(operation, options = {}) {
 return { getInputData: () => [{json:{}}], getNodeParameter: (key) => key === 'operation' ? operation : options[key], getNode: () => ({ name:'TuneViva', type:'tuneViva', typeVersion:1 }), continueOnFail: () => false, helpers: {httpRequest: options.request || (() => {throw Error('unexpected request')})} };
}
test('gets score from fixed API origin and preserves item link', async () => {
 let requested; const ctx = context('score', {scoreId:'70152', request: async args => {requested = args; return {title:'Example',musicxml:'https://tuneviva.com/x'};}});
 const [[item]] = await node.execute.call(ctx); assert.equal(requested.url,'https://tuneviva.com/api/practice/70152'); assert.equal(item.json.practiceURL,'https://tuneviva.com/learn/?score=70152'); assert.deepEqual(item.pairedItem,{item:0});
});
test('rejects malformed IDs without making a request', async () => { await assert.rejects(node.execute.call(context('score',{scoreId:'../x'})),/valid numeric score ID/); });
test('encodes query in a catalogue link without making a request', async () => { const [[item]]=await node.execute.call(context('search',{query:'Bach & cello'})); assert.equal(new URL(item.json.searchURL).searchParams.get('q'),'Bach & cello'); });
test('scanner link states recognition happens in browser', async () => {const [[item]]=await node.execute.call(context('scan')); assert.match(item.json.note,/browser/); });
