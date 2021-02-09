import {
  APIGatewayProxyEvent as Event,
} from "aws-lambda";

interface AuthResponse {
  isAuthorized: boolean;
}

export const handler = async (event: Event): Promise<AuthResponse> => {
  return {
    isAuthorized: event.headers.authorization === "secret"
  };
};
