import * as numeral from 'numeral';
import { useReducer, useState } from 'react';
import BlockUI from '../block-ui/block-ui';

type RequestData = {
  spreadsheetId: string;
  sheetName: string;
  summaryStartCell: string;
  summaryEndCell: string;
  threePStatementStartCell: string;
};
type Action = { type: string; value: string };

function reducer(state: RequestData, action: Action): RequestData {
  switch (action.type) {
    case 'spreadsheetId':
      return { ...state, spreadsheetId: action.value };
    case 'sheetName':
      return { ...state, sheetName: action.value };
    case 'summaryStartCell':
      return { ...state, summaryStartCell: action.value };
    case 'summaryEndCell':
      return { ...state, summaryEndCell: action.value };
    case 'threePStatementStartCell':
      return { ...state, threePStatementStartCell: action.value };
    default:
      throw new Error();
  }
}

function downloadBlob(blob, name = 'file.txt') {
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = name;

  // Append link to the body
  document.body.appendChild(link);

  // Dispatch click event on the link
  // This is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  // Remove link from body
  document.body.removeChild(link);
}

const FineTuningDataSetJsonl = ({ jsonlDefault }) => {
  const {
    _spreadsheetId,
    _sheetName,
    _summaryStartCell,
    _summaryEndCell,
    _threePStatementStartCell,
    _gpt3FineTuningJsonlEndpoint,
  } = jsonlDefault;
  const [data, dispatch] = useReducer(reducer, {
    spreadsheetId: _spreadsheetId,
    sheetName: _sheetName,
    summaryStartCell: _summaryStartCell,
    summaryEndCell: _summaryEndCell,
    threePStatementStartCell: _threePStatementStartCell,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onClickGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch(_gpt3FineTuningJsonlEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      // const result = await response.json();
      // setMessage(result?.result ? 'Success' : result.message || 'Failed');
      const blob = await response.blob();
      // var objectURL = URL.createObjectURL(blob);

      // setMessage(objectURL);

      // window.open(objectURL, '_blank');
      downloadBlob(blob, 'fine-tuning-dataset.jsonl');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const {
    spreadsheetId,
    sheetName,
    summaryStartCell,
    summaryEndCell,
    threePStatementStartCell,
  } = data;

  return (
    <form method="POST">
      <div>
        <div className="relative shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-2">
                <label
                  htmlFor="spreadsheetId"
                  className="block text-sm font-medium text-gray-700"
                >
                  SpreadsheetId
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="spreadsheetId"
                    id="spreadsheetId"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 min-w-400"
                    value={spreadsheetId}
                    onChange={(event) =>
                      dispatch({
                        type: 'spreadsheetId',
                        value: event.target.value,
                      })
                    }
                    placeholder={''}
                  />
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label
                  htmlFor="sheetName"
                  className="block text-sm font-medium text-gray-700"
                >
                  SheetName
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="sheetName"
                    id="sheetName"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                    placeholder={''}
                    value={sheetName}
                    onChange={(event) =>
                      dispatch({
                        type: 'sheetName',
                        value: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Summary
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="summaryStartCell"
                  >
                    Start
                  </label>
                  <input
                    id="summaryStartCell"
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={summaryStartCell}
                    onChange={(event) =>
                      dispatch({
                        type: 'summaryStartCell',
                        value: event.target.value,
                      })
                    }
                  />
                  <label
                    className="block text-sm font-medium text-gray-700 ml-5"
                    htmlFor="summaryEndCell"
                  >
                    End
                  </label>
                  <input
                    id="summaryEndCell"
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={summaryEndCell}
                    onChange={(event) =>
                      dispatch({
                        type: 'summaryEndCell',
                        value: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  3P Statement
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="threePStatementStartCell"
                  >
                    Start
                  </label>
                  <input
                    id="threePStatementStartCell"
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={threePStatementStartCell}
                    onChange={(event) =>
                      dispatch({
                        type: 'threePStatementStartCell',
                        value: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          {loading && <BlockUI />}
        </div>
        <p>{message}</p>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onClickGenerate}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate
          </button>
        </div>
      </div>
    </form>
  );
};

export default FineTuningDataSetJsonl;
