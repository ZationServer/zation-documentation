static config : ControllerConfig = {

    //Only the clients with system A or W are allowed. If the client has
    //system A, he needs to have at least version 1.0,
    //and when the client has system W, he needs to have at
    //least version 2.0.
    versionAccess : {
        'A' : 1.0,
        'W' : 2.0
    },

    //Only the clients with system O are allowed. If the client has the
    //system O, he needs to have version 1.0, 2.0 or 3.5.
    versionAccess : {
        'O' : [1.0,2.0,3.5]
    }

};