import type { NextPage, GetServerSideProps } from 'next';
import { useReducer, useState } from 'react';
import * as fs from 'fs';
import * as numeral from 'numeral';
import Layout from '../components/layout/layout';
import { Tab } from '@headlessui/react';
import FineTuningDataSetGpt3Summary from '../components/fine-tuning-dataset/fine-tuning-dataset-gpt3-summary';
import FineTuningDataSetJsonl from '../components/fine-tuning-dataset/fine-tuning-dataset-jsonl';

interface Props {
  summaryDefault: {
    _spreadsheetId?: string;
    _sheetName: string;
    _gpt3Prompt: string;
    _rawContentStartCell: string;
    _rawContentEndCell: string;
    _summaryStartCell: string;
    _gpt3FineTuningEndpoint: string;
    _rawContentWordCount: number;
  };
  jsonlDefault: {
    _spreadsheetId?: string;
    _sheetName: string;
    _summaryStartCell: string;
    _summaryEndCellL: string;
    _threePStatementStartCell: string;
  };
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Home: NextPage<Props> = (props) => {
  const { summaryDefault, jsonlDefault } = props;

  return (
    <Layout>
      <div className="flex h-full justify-center items-center antialiased font-sans bg-gray-200 overflow-hidden">
        <div className="min-w-1/2 min-h-2/3">
          <Tab.Group>
            <Tab.List className="flex p-1 space-x-1 bg-blue-900/20 rounded-xl">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full py-2.5 text-sm leading-5 font-medium text-blue-700 rounded-lg',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                    selected
                      ? 'bg-white shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                  )
                }
              >
                Gpt3 Summary
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full py-2.5 text-sm leading-5 font-medium text-blue-700 rounded-lg',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                    selected
                      ? 'bg-white shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                  )
                }
              >
                Fine Tuning DataSet Jsonl
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <FineTuningDataSetGpt3Summary summaryDefault={summaryDefault} />
              </Tab.Panel>
              <Tab.Panel>
                <FineTuningDataSetJsonl jsonlDefault={jsonlDefault} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const summaryDefault = {
    _spreadsheetId: process.env.FINETUNING_SPREADSHEET_ID,
    _sheetName: process.env.FINETUNING_SHEET_NAME,
    _rawContentStartCell: process.env.FINETUNING_RAW_START_CELL,
    _rawContentEndCell: process.env.FINETUNING_RAW_END_CELL,
    _summaryStartCell: process.env.FINETUNING_SUMMARY_START_CELL,
    _rawContentWordCount: numeral(process.env.FINTUNING_RAW_WORD_COUNT).value(),
    _gpt3FineTuningEndpoint:
      `${process.env.BACKEND_SCHEMA}://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}/` +
      `${process.env.FINETUNING_DATASET_ENDPOINT}`,
    _gpt3Prompt: '',
  };

  let _gpt3Prompt = '';
  try {
    _gpt3Prompt = await new Promise((resolve, reject) => {
      fs.readFile('.gpt3PromptForSummary', 'utf-8', async (err, content) => {
        if (err) return reject(err);
        resolve(content);
      });
    });
  } catch (error) {}
  summaryDefault._gpt3Prompt = _gpt3Prompt;

  const jsonlDefault = {
    _spreadsheetId: process.env.FINETUNING_JSONL_SPREADSHEET_ID,
    _sheetName: process.env.FINETUNING_JSONL_SHEET_NAME,
    _summaryStartCell: process.env.FINETUNING_JSONL_SUMMARY_START_CELL,
    _summaryEndCell: process.env.FINETUNING_JSONL_SUMMARY_END_CELL,
    _threePStatementStartCell:
      process.env.FINETUNING_JSONL_THREEPSTATMENT_START_CELL,
    _gpt3FineTuningJsonlEndpoint:
      `${process.env.BACKEND_SCHEMA}://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}/` +
      `${process.env.FINETUNING_DATASET_JSONL_ENDPOINT}`,
  };

  return {
    props: {
      summaryDefault,
      jsonlDefault,
    },
  };
};

export default Home;
