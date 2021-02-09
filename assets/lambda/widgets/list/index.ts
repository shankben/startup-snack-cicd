import {
  APIGatewayProxyEvent as Event,
  APIGatewayProxyResult as Result
} from "aws-lambda";

const widgets = [
  {
    id: 1,
    name: "Production Widget 1"
  },
  {
    id: 2,
    name: "Production Widget 2"
  }
];

export const handler = async (event: Event): Promise<Result> => {
  return {
    statusCode: 200,
    body: JSON.stringify(widgets, null, 2)
  };
};
