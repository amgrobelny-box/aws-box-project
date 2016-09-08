# Box App Users Client Side Application with AWS Lambda Back End

I've included this sample code to demostrate the two methods you'd need to power a serverless implementation of using Box Platform with App Users.

Here's a link to the PPT presentation associated with this project.
[Box Platform Serverless Presentation](https://cloud.box.com/s/fnfv8gce1jklhxpfjyl670lipdbg8gvw)

You can utilize this guide to help you get things set up:
[Auth0 Securing API Gateway](https://auth0.com/docs/integrations/aws-api-gateway)

Additional information on setting up Elasticache to be accessible by lambda:
[Access Elasticache from Lambda](http://docs.aws.amazon.com/lambda/latest/dg/vpc-ec.html)

Each lambda function needs to have the private key you registered with Box for your application.

Additionally, each lambda has config files for environment variables for Auth0, Box, and Elasticache Redis. Replace these with your own environment variables for each.

The Angular client will also need your Auth0 credentials in the `auth0-variables.js` file.

Martin Fowler wrote an amazing article on serverless architecture:
[Serverless Architectures](http://martinfowler.com/articles/serverless.html)

Here's some more information on Box App Users:
[Build on Box Platform](https://docs.box.com/docs/getting-started-box-platform)
