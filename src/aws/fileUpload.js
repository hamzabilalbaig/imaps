import AWS from 'aws-sdk';


const uploadFile = async (file, setLoading) => {
  setLoading(true);
  const S3_BUCKET = process.env.REACT_APP_S3_BUCKET;
  const REGION = process.env.REACT_APP_AWS_REGION;

  console.log('Uploading file to S3:', file);

  AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  });
  const s3 = new AWS.S3({
    params: { Bucket: S3_BUCKET },
    region: REGION,
  });

  let fileName, contentType, fileBody;

  // Check if file is a custom object with base64 data
  if (file.data && typeof file.data === 'string' && file.data.startsWith('data:')) {
    // Extract content type and base64 data
    const matches = file.data.match(/^data:(.+);base64,(.*)$/);
    if (matches) {
      contentType = matches[1];
      const base64Data = matches[2];
      // Convert base64 to Blob (browser compatible)
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      fileBody = new Blob([ab], { type: contentType });
      fileName = file.name + Math.random().toString(36).substring(7);
    } else {
      setLoading(false);
      throw new Error('Invalid base64 data format');
    }
  } else {
    // Assume file is a File/Blob object
    fileName = file.name + Math.random().toString(36).substring(7);
    contentType = file.type;
    fileBody = file;
  }

  const params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    ContentType: contentType,
    Body: fileBody,
  };

  const upload = s3
    .putObject(params)
    .on('httpUploadProgress', (evt) => {
      if (evt.total) {
        console.log('Uploading ' + ((evt.loaded * 100) / evt.total).toFixed(2) + '%');
      }
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
      fileUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${fileName}`;
    })
    .catch((err) => {
      console.log('err ', err);
      setLoading(false);
      //alert('File upload failed. with error: ' + err);
    });

  return fileUrl;

};

export default uploadFile;
