# QuickSight Embedding sample

This repo focuses on setting up a serverless backend for dashboard embedding.

Contains frontend starter page (index.html) that does not have any authentication.. Only for testing the embed URL in frontend easily.

User should setup a frontend app with an authentication mechanism of his/her choice and route users to pages similar to index.html which contain the embedded dashboard.

## Follow the below steps to set the backend that generates the Embed URL:


### 1.  Create an IAM policy QsEmbedPolicyForIAMBasedIdentities that grants the following permissions:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "quicksight:RegisterUser",
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": "quicksight:GetDashboardEmbedUrl",
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
  
### 2.  Create a new lambda function QsEmbedLambda which uses a new role with basic lambda permissions as an execution role.


### 3.  Create an  IAM role QsEmbedRole with following trust policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<Arn of the lambda function execution role >"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

### 4. Attach the IAM policy QsEmbedPolicyForIAMBasedIdentities (created in step 1) to the role QsEmbedRole (created in step 3).

### 5.  Create following IAM policies:

1.  DescribeAnyUser

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "quicksight:DescribeUser",
            "Resource": "*"
        }
    ]
}

2. AssumeEmbedRole

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "<>"
        }
    ]
}

3. EmbedPolicyForQuickSightIdentities

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "quicksight:GetDashboardEmbedUrl",
                "quicksight:GetAuthCode"
            ],
            "Resource": "*"
        }
    ]
}


### 6. Attach policies created in step 5 to the lambda funciton execution role.


### 7. Setup the lambda function using the code available at https://github.com/MihirLimbachia/QuickSightSamples/blob/master/QuickSightEmbeddingLambda/index.js

        Set the AWS accont id in the lambda function https://github.com/MihirLimbachia/QuickSightSamples/blob/195887abcc5b436791d6df7564008ee51028c1c6/QuickSightEmbeddingLambda/index.js#L20
        
        Set the roleToAssume in the lambda function https://github.com/MihirLimbachia/QuickSightSamples/blob/195887abcc5b436791d6df7564008ee51028c1c6/QuickSightEmbeddingLambda/index.js#L21
        to arn of the role QsEmbedRole create in step 3.


The lambda function expects following paramters as Query string parameters from the API gateway.

1. dashboardID 		    	
2. dashboardRegion 			
3. emailID 	(identifier of the user created in QuickSight)		
4. role 	 (READER | ADMIN | AUTHOR )		
5. userType   (IAM | QUICKSIGHT)			


### 8. Setup API gateway API with a GET method that acts as a proxy for the above created lambda function.

    Follow steps similar to ones mentioned in the below link: 
    
    https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
    
    
    
###  9. Test out the above created api with the neccessary query string parameters:

    https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-test-method.html

    1. For IAM based identities (Creates a QuickSight user with user name <QsEmbedRole/>):
    
    role=READER&dashboardID=<dashboard ID>&emailID=<email id>&dashboardRegion=<dashboard region code (for eg. us-east-1)>&userType=IAM
    
    2.  For QuickSight based identities (A QuickSight user with the same name as email id should already be registered):
    
    role=READER&dashboardID=<dashboard ID>&emailID=<email id>&dashboardRegion=<dashboard region code (for eg. us-east-1)>&userType=QUICKSIGHT
    
    
### 10.  Publish the API created in step 8 to a stage by following the steps mentioned in the below link:

     https://docs.aws.amazon.com/apigateway/latest/developerguide/stages.html#how-to-create-stage-console
     
     
### 11. Get the invoke URL for the GET API for the stage published in step 10.

     https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-call-api.html#apigateway-how-to-call-rest-api
     
     
### 12. Append the query string parameters to the invoke url retrieved in step 11 and test the GET api in browser.

    <invoke URL>?role=READER&dashboardID=<dashboard ID>&emailID=<email id>&dashboardRegion=<dashboard region code (for eg. us-east-1)>&userType=IAM
    

## Now that the backend's ready.. lets tryout the API in a simple apache web page.

### 1. Setup an EC2 instance with a security group that allows ssh and HTTPS traffic in its inbound rules.


### 2. QuickSight requires the frontend webapp to have a valid CA signed certificate.  Hence, we need a domain and a certificate corresponding to it. Also once we have the certificate, we need to configure SSL in the apache web server with the generaeted certificate.

       a. Get a free domain using the steps in the below article

       https://medium.com/@kcabading/getting-a-free-domain-for-your-ec2-instance-3ac2955b0a2f 
     
       b. Generate a SSL certificate from https://www.sslforfree.com/. Make sure to generate the certificate for a subdomain. For example, a.example.com
       
       In order to verify domain ownership, you should setup the txt records in the Route53 hosted zone setup in step 2.a
     
       c. Install and Configure Apache web server on the EC2 instance by following the steps in the below link:
        
          https://geekflare.com/apache-setup-ssl-certificate/
          
          The download link for apache is broken.. you may use wget http://mirrors.estointernet.in/apache//httpd/httpd-2.4.41.tar.gz
           
          For configuration only use: ./configure --enable-ssl
          
          If you face any errors during configuration.... refer https://geekflare.com/apache-installation-troubleshooting/
          
          Follow rest of the steps to the letter in the article..
          
### 3. Once the apache web server has been configured for SSL, lets setup a test index.html page that invokes the API.

       a. Update the gatewayApiUrl in index.html
       https://github.com/MihirLimbachia/QuickSightSamples/blob/f4c3e8660a8fdb6d27fe297422f53c11667748b5/index.html#L48
           to  GET API invoke url from step 11.
           
       b. Update the index.html page in the apache web browser.
          
          cp index.html /usr/local/apache2/htdocs/
           
       c.  Start the apache web server.
       
           cd /usr/local/apache2/bin
           ./apachectl start
           
### 4. Configure an A record in the route53 hosted zone with same name as the one for which we generated the SSL certificate. Set value for the record as the EC2 instance IP.

       https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html
       
       
       
### 5. Whitelist the domain in the QuickSight account in the same region as the dashboard's region.

       https://docs.aws.amazon.com/quicksight/latest/user/approve-domain-for-dashboard-embedding.html
       
### 6. Make sure that the dashboard/s is/are shared with the QuickSight user/users who is/are using the embed url.

       https://docs.aws.amazon.com/quicksight/latest/user/sharing-a-dashboard.html
       
# Hit the domain !!! 
