# Basics Bags

In this chapter, I will explain a little basic understanding of bags from the Zation framework. 
In general, it is a class from the server part of the Zation framework that provides a lot of useful functions like a big toolbox. 
All features of the bags are well documented. 
So if you don' t know what this function is doing you can look in the documentation of the API. 
In some IDE's you can directly view the documentation of a function. 
There are two different bags: the SmallBag and the Bag.

## SmallBag

The SmallBag provides a lot of different services, e.g. cartographical tools, access to your services, error creation, information of your server, channel tools, worker variables, socket tools and many more. 
It's like a big toolbox which provides information and tools. 
You will often get a SmallBag as a parameter of events. 

## Bag

The Bag is an extension of the SmallBag, that means that the Bag can do all that the SmallBag can.
But the Bag is bound to a request and a client, so there are new functions which depends on the request or the client. 
For example, you can get information about the client or the request.