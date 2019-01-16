# User Groups

The Zation framework is using user groups for defining access rights. 
The user groups are split into two types: the authentication groups and the default group. 
The default group will be used when the client is not authenticated, so the client is like a guest.
When we authenticate a client, the client will get a token. 
This token is like an id card and contains the current authentication user group and much more information.
That means that the client belongs to an authentication user group and not anymore to the default group.
Note that you only can have one default group and multiple authentication groups. 
This chapter will explain how you can declare them. 
Later, we will use these user groups.
## Declare

The user groups can be defined in the app configuration. 

[](./../../_code/userGroups.js ':include :type=js')

The name of the default user group can be set with the property default of the user groups object.
Your authentication user groups can be defined in the property auth of the user group object.
Every user group name must be unique.
The value of the authentication user groups needs to be an object because with that object you can specify extra advanced options for this user group.

!> **Warning !** You also can't use these reserved keywords as a user group name:  allAuth, allNotAuth and all.



