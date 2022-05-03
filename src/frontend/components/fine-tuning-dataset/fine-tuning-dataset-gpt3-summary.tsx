import * as numeral from 'numeral';
import { useReducer, useState } from 'react';
import BlockUI from '../block-ui/block-ui';

type FineTuningData = {
  spreadsheetId: string;
  sheetName: string;
  gpt3Prompt: string;
  rawContentStartCell: string;
  rawContentEndCell: string;
  rawContentWordCount: number;
  summaryStartCell: string;
};
type Action = { type: string; value: string };

function reducer(state: FineTuningData, action: Action): FineTuningData {
  switch (action.type) {
    case 'spreadsheetId':
      return { ...state, spreadsheetId: action.value };
    case 'sheetName':
      return { ...state, sheetName: action.value };
    case 'gpt3Prompt':
      return { ...state, gpt3Prompt: action.value };
    case 'rawContentStartCell':
      return { ...state, rawContentStartCell: action.value };
    case 'rawContentEndCell':
      return { ...state, rawContentEndCell: action.value };
    case 'summaryStartCell':
      return { ...state, summaryStartCell: action.value };
    case 'rawContentWordCount':
      return { ...state, rawContentWordCount: numeral(action.value).value() };
    default:
      throw new Error();
  }
}

const FineTuningDataSetGpt3Summary = ({ summaryDefault }) => {
  const {
    _spreadsheetId,
    _sheetName,
    _gpt3Prompt,
    _rawContentStartCell,
    _rawContentEndCell,
    _summaryStartCell,
    _gpt3FineTuningEndpoint,
    _rawContentWordCount,
  } = summaryDefault;

  const [data, dispatch] = useReducer(reducer, {
    spreadsheetId: _spreadsheetId,
    sheetName: _sheetName,
    gpt3Prompt: _gpt3Prompt,
    rawContentStartCell: _rawContentStartCell,
    rawContentEndCell: _rawContentEndCell,
    summaryStartCell: _summaryStartCell,
    rawContentWordCount: _rawContentWordCount,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onClickGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch(_gpt3FineTuningEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      setMessage(result?.result ? 'Success' : result.message || 'Failed');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const {
    spreadsheetId,
    sheetName,
    gpt3Prompt,
    rawContentStartCell,
    rawContentEndCell,
    summaryStartCell,
    rawContentWordCount,
  } = data;

  return (
    <form method="POST">
      <div>
        {/* <div className="px-4 py-3 bg-gray-50 text-left sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Fine Tuning DataSet
        </h3>
      </div> */}
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
                  Raw content
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="rawContentStartCell"
                  >
                    Start
                  </label>
                  <input
                    id="rawContentStartCell"
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={rawContentStartCell}
                    onChange={(event) =>
                      dispatch({
                        type: 'rawContentStartCell',
                        value: event.target.value,
                      })
                    }
                  />
                  <label
                    className="block text-sm font-medium text-gray-700 ml-5"
                    htmlFor="rawContentEndCell"
                  >
                    End
                  </label>
                  <input
                    id="rawContentEndCell"
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={rawContentEndCell}
                    onChange={(event) =>
                      dispatch({
                        type: 'rawContentEndCell',
                        value: event.target.value,
                      })
                    }
                  />
                  <label
                    className="block text-sm font-medium text-gray-700 ml-5"
                    htmlFor="rawContentWordCount"
                  >
                    WordCount
                  </label>
                  <input
                    id="rawContentWordCount"
                    type="number"
                    min={10}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300 w-24 ml-5"
                    value={rawContentWordCount}
                    onChange={(event) =>
                      dispatch({
                        type: 'rawContentWordCount',
                        value: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gpt summary
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
                </div>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Gpt3 pormpt
                </label>
                <textarea
                  rows={10}
                  value={gpt3Prompt}
                  className="w-full mt-1 focus:ring-indigo-500 focus:border-indigo-500 block rounded-md sm:text-sm border-gray-300"
                  onChange={(event) =>
                    dispatch({
                      type: 'gpt3Prompt',
                      value: event.target.value,
                    })
                  }
                />
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

export default FineTuningDataSetGpt3Summary;
