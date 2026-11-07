import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class TuneViva implements INodeType {
 description: INodeTypeDescription = {
  displayName: 'TuneViva', name: 'tuneViva', icon: 'file:tuneviva.svg', group: ['transform'], version: 1, subtitle: '={{$parameter["operation"]}}',
  description: 'Get sheet music practice details or create a TuneViva link',
  defaults: { name: 'TuneViva' }, inputs: [NodeConnectionTypes.Main], outputs: [NodeConnectionTypes.Main], usableAsTool: true,
  properties: [
   { displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, options: [
    { name: 'Create Search Link', value: 'search', action: 'Create a search link', description: 'Create a link to search the TuneViva catalogue' },
    { name: 'Get Practice Score', value: 'score', action: 'Get a practice score', description: 'Retrieve score metadata and a MusicXML link by score ID' },
    { name: 'Get Scanner Link', value: 'scan', action: 'Get a scanner link', description: 'Get the browser-local sheet music scanner link' },
   ], default: 'score' },
   { displayName: 'Score ID', name: 'scoreId', type: 'string', required: true, default: '', description: 'Numeric ID from a TuneViva score URL', displayOptions: { show: { operation: ['score'] } } },
   { displayName: 'Search Query', name: 'query', type: 'string', required: true, default: '', description: 'Composer, title, or other search terms', displayOptions: { show: { operation: ['search'] } } },
  ],
 };
 async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const output: INodeExecutionData[] = [];
  for (let i = 0; i < items.length; i++) {
   try {
    const operation = this.getNodeParameter('operation', i) as string;
    if (operation === 'score') {
     const id = (this.getNodeParameter('scoreId', i) as string).trim();
     if (!/^[1-9]\d{0,9}$/.test(id)) throw new NodeOperationError(this.getNode(), 'Enter a valid numeric score ID.', { itemIndex: i });
     const data = await this.helpers.httpRequest({ method: 'GET', url: `https://tuneviva.com/api/practice/${id}`, json: true, timeout: 10000 });
     output.push({ json: { ...data, practiceURL: `https://tuneviva.com/learn/?score=${id}` }, pairedItem: { item: i } });
    } else if (operation === 'search') {
     const query = (this.getNodeParameter('query', i) as string).trim();
     if (!query || query.length > 200) throw new NodeOperationError(this.getNode(), 'Enter a search query of 1–200 characters.', { itemIndex: i });
     output.push({ json: { query, searchURL: `https://tuneviva.com/search?${new URLSearchParams({ q: query })}` }, pairedItem: { item: i } });
    } else if (operation === 'scan') {
     output.push({ json: { scannerURL: 'https://tuneviva.com/recognize', note: 'Recognition runs locally in the browser.' }, pairedItem: { item: i } });
    } else { throw new NodeOperationError(this.getNode(), 'Unknown operation.', { itemIndex: i }); }
   } catch (error) {
    if (!this.continueOnFail()) throw new NodeOperationError(this.getNode(), error instanceof Error ? error.message : String(error), { itemIndex: i });
    output.push({ json: { error: error instanceof Error ? error.message : String(error) }, pairedItem: { item: i } });
   }
  }
  return [output];
 }
}
