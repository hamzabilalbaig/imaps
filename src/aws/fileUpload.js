import AWS from 'aws-sdk';

const uploadFile = async (file, setLoading) => {
  setLoading(true);
  const S3_BUCKET = process.env.REACT_APP_S3_BUCKET;
  const REGION = process.env.REACT_APP_AWS_REGION;

  AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  });
  const s3 = new AWS.S3({
    params: { Bucket: S3_BUCKET },
    region: REGION,
  });

  const params = {
    Bucket: S3_BUCKET,
    Key: file.name,
    Body: file instanceof Blob ? file : new Blob([file]),
  };

  const upload = s3
    .putObject(params)
    .on('httpUploadProgress', (evt) => {
      console.log('Uploading ' + (evt.loaded * 100) / evt.total + '%');
    })
    .promise();
  let fileUrl = '';

  await upload
    .then((result) => {
      console.log('result: ', result);
      if (result.$response.httpResponse.statusCode === 200) {
        console.log('File uploaded successfully.');
      } else {
        console.log('File upload failed.');
      }

      setLoading(false);
      fileUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${file.name}`;
    })
    .catch((err) => {
      console.log('err ', err);
      setLoading(false);
      //alert('File upload failed. with error: ' + err);
    });

  return fileUrl;

};

export default uploadFile;
