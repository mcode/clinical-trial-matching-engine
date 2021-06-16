
// Import an S3 client
const {
    S3Client,
    CreateBucketCommand,
    PutBucketWebsiteCommand,
    PutBucketPolicyCommand
  } = require("@aws-sdk/client-s3");
  
  // Set the AWS Region
  const REGION = "us-east-1"; //e.g. "us-east-1"
  
  // Create params JSON for S3.createBucket
  const bucketName = "clinical-trial-matching-engine-pdm"; //BUCKET_NAME
  const bucketParams = {
    Bucket: bucketName
  };
  
  // Create params JSON for S3.setBucketWebsite
  const staticHostParams = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: "error.html",
      },
      IndexDocument: {
        Suffix: "index.html",
      },
    },
  };
  
  var readOnlyAnonUserPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AddPerm",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [""],
      },
    ],
  };
  
  // create selected bucket resource string for bucket policy
  const bucketResource = "arn:aws:s3:::" + bucketName + "/*"; //BUCKET_NAME
  readOnlyAnonUserPolicy.Statement[0].Resource[0] = bucketResource;
  
  // convert policy JSON into string and assign into params
  const bucketPolicyParams = {
    Bucket: bucketName,
    Policy: JSON.stringify(readOnlyAnonUserPolicy)
  };
  
  // Instantiate an S3 client
  const s3 = new S3Client({ region: REGION });
  
  const run = async () => {
    try {
      // Call S3 to create the bucket
      const response = await s3.send(new CreateBucketCommand(bucketParams));
      console.log("Bucket URL is ", response.Location);
    } catch (err) {
      console.log("Error", err);
    }
    try {
      // Set the new policy on the newly created bucket
      const response = await s3.send(
        new PutBucketWebsiteCommand(staticHostParams)
      );
      // Update the displayed policy for the selected bucket
      console.log("Success", response);
    } catch (err) {
      // Display error message
      console.log("Error", err);
    }
  };
  
  run();
  