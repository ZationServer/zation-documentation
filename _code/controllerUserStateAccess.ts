static config : ControllerConfig = {

    //Only the clients with the user id 10 have access to this controller.
    access : 10,

    //All clients have access to this controller except the client with user id 10.
    notAccess : 10,

    //Only the clients with the user id 10, 13 or 5 have access to this controller.
    access : [10,13,5],

    //Only the clients with user group admin have access to this controller.
    access : 'admin',

    //Only the clients with user group admin or default user group guest
    //have access to this controller.
    access : ['guest','user'],

    //Only the clients with user group admin or user have access to this controller.
    access : ['admin','user'],

    //Only the clients with user group admin or user id 3 or 2 have
    //access to the controller.
    access : ['admin',2,3],

    //Every client has access to this controller.
    access : 'all',

    //Only the clients they are authenticated (Have an auth user group)
    //have access to the controller. (So the default group not)
    access : 'allAuth',

    //Only clients with the default user group have access to this controller.
    //(That means all not authenticated clients)
    access : 'allNotAuth',

    //If this function returns true the client has access.
    //Note that the parameter token can be null if the client is not authenticated.
    access : (smallBag,token) => {}

};