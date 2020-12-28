import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
import SecretsManager from "aws-sdk/clients/secretsmanager";

const REGION = process.env.AWS_REGION ??
  process.env.CDK_DEPLOY_REGION ??
  process.env.CDK_DEFAULT_REGION ??
  "us-east-1";

const SECRETS_PATH = path.join(__dirname, "..", "..", "secrets");
AWS.config.update({ region: REGION });

const sm = new SecretsManager();

const ensureSecrets = async () => Promise.all(fs
  .readdirSync(SECRETS_PATH)
  .filter((it) => /^[A-Za-z]/.test(it))
  .map(async (name) => {
    console.log(`Checking ${name}`);
    const parameterName = `/CDKSnackCICD/${name}`;
    const res = await sm.listSecrets().promise();
    return (res.SecretList ?? []).find((it) => it.Name === parameterName) ?
      console.log(`Up to date: ${name} -> ${parameterName}`) :
      (async () => {
        console.log(`Storing: ${name} -> ${parameterName}`);
        const value = fs.readFileSync(path.join(SECRETS_PATH, name)).toString();
        return sm.createSecret({
          Name: parameterName,
          SecretString: value
        }).promise();
      })();
  }));

export {
  ensureSecrets
};
