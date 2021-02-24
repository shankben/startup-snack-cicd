import {
  APIGatewayProxyEvent as Event,
  APIGatewayProxyResult as Result
} from "aws-lambda";

export const handler = async (event: Event): Promise<Result> => {
  console.log("Creating a Widget");
  return {
    statusCode: 200,
    body: ""
  };
};
