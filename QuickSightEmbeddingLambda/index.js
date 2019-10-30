/* ===========================================
  Author: Mihir Limbachia 
  Date:   20th October 2019
   ============================================
*/

const AWS = require('aws-sdk');
const StsClient = new AWS.STS();


exports.handler = async (event) => {
    try {
        console.log(event);
        const Role = event.queryStringParameters.role;
        const dashboardID = event.queryStringParameters.dashboardID;
        const emailID = event.queryStringParameters.emailID;
        const dashboardRegion = event.queryStringParameters.dashboardRegion;
        const userType = event.queryStringParameters.userType;
        console.log(userType, Role, dashboardID, emailID, dashboardRegion);
        const accountID = '365032828610';
        const roleToAssume = "arn:aws:iam::365032828610:role/LambdaQsDashboaradEmbedding";
        if (userType == 'IAM') {

            /* logic for IAM based identities */

            const StsAssumeRoleparams = {
                DurationSeconds: 3600,
                RoleArn: roleToAssume,
                RoleSessionName: emailID
            };

            let assumeRoleResp = await StsClient.assumeRole(StsAssumeRoleparams).promise();

            let QSClientCredentials = {

                accessKeyId: assumeRoleResp.Credentials.AccessKeyId,
                secretAccessKey: assumeRoleResp.Credentials.SecretAccessKey,
                sessionToken: assumeRoleResp.Credentials.SessionToken
            }

            let QSClientForRegisteringUserOptions = { credentials: QSClientCredentials, region: 'us-east-1' };

            let QSClientForGeneratingDashboardOptions = { credentials: QSClientCredentials, region: dashboardRegion };

            const QSClientForRegisteringUser = new AWS.QuickSight(QSClientForRegisteringUserOptions);

            const QSClientForGeneratingDashboard = new AWS.QuickSight(QSClientForGeneratingDashboardOptions);

            let regUserparams = {
                AwsAccountId: accountID, /* required */
                Email: emailID, /* required */
                IdentityType: 'IAM',
                Namespace: 'default', /* required */
                UserRole: Role, /* required */
                IamArn: roleToAssume,
                SessionName: emailID
            };

            try {
                let regUserResp = await QSClientForRegisteringUser.registerUser(regUserparams).promise();
                console.log(regUserResp);
            }
            catch (Error) {
                console.log(Error)
                if (Error.code == 'ResourceExistsException') {
                    console.log("user already exists");
                }
                else {
                    console.log("register user failed");
                    let response = {
                        statusCode: 500,
                        body: JSON.stringify(Error),
                        headers: {
                            "Access-Control-Allow-Origin": "*"
                        }
                    };
                    return response;
                }
            }
            finally {
                try {
                    let getDashboardParams = {
                        AwsAccountId: accountID, /* required */
                        DashboardId: dashboardID, /* required */
                        IdentityType: 'IAM', /* required */
                        SessionLifetimeInMinutes: 600,
                    };
                    let QSDashboardEmbedResponse = await QSClientForGeneratingDashboard.getDashboardEmbedUrl(getDashboardParams).promise();

                    let responseOk = {
                        statusCode: 200,
                        body: JSON.stringify(QSDashboardEmbedResponse),
                        headers: {
                            "Access-Control-Allow-Origin": "*"
                        }
                    };
                    return responseOk
                }
                catch (Error) {
                    let response = {
                        statusCode: 500,
                        body: JSON.stringify(Error),
                        headers: {
                            "Access-Control-Allow-Origin": "*"
                        },
                    };
                    return response;
                }
            }

        }
        else {
            /* logic for QuickSight based identities */
            
        
            const QSClientForGeneratingDashboard = new AWS.Service({ 
                apiConfig: require('./quicksight_latest_api.json'),
                region: dashboardRegion
                }); 
            let userArn;
            
            try {

                const QSClientForDescribeUser = new AWS.QuickSight({ region: 'us-east-1' });

                let describeUserparams = {
                    AwsAccountId: accountID, /* required */
                    Namespace: 'default', /* required */
                    UserName: emailID /* required */
                };
              
                let QSDescribeUserResponse = await QSClientForDescribeUser.describeUser(describeUserparams).promise();
                
                // console.log(QSDescribeUserResponse)
                
                userArn = QSDescribeUserResponse['User']['Arn'];
                
                // console.log(userArn);
                
            }
            catch (Error) {
                console.log("describe user failed");
                
                console.log (Error);
                let response = {
                    statusCode: 500,
                    
                    body: JSON.stringify(Error),
                    headers: {
                        "Access-Control-Allow-Origin": "*"
                    },
                };
                return response;
            }
            finally {
                try {
                    let getDashboardParams = {
                        AwsAccountId: accountID, /* required */
                        DashboardId: dashboardID, /* required */
                        IdentityType: 'QUICKSIGHT', /* required */
                        UserArn: userArn
                    };
                    
                    console.log(getDashboardParams);
                    let QSDashboardEmbedResponse = await QSClientForGeneratingDashboard.getDashboardEmbedUrl(getDashboardParams).promise();

                    let responseOk = {
                        statusCode: 200,
                        body: JSON.stringify(QSDashboardEmbedResponse),
                        headers: {
                            "Access-Control-Allow-Origin": "*"
                        }
                    };
                    return responseOk
                }
                catch (Error) {
                    
                    console.log ("get embed call failed");
                    let response = {
                        statusCode: 500,
                        body: JSON.stringify(Error),
                        headers: {
                            "Access-Control-Allow-Origin": "*"
                        },
                    };
                    return response;
                }
            }
        }

    }
    catch (Error) {
        console.log(Error)
        let response = {
            statusCode: 500,
            body: JSON.stringify(Error),
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
        };
        return response;
    }
};
