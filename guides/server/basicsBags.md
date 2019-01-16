# Basics Bags

This chapter will give you a basic understanding of the two bags from the Zation framework. 

In general, the bags are classes from the Zation framework which provides useful functions. 
All features of the bags are well documented. 
So if you don' t know what this function is doing you can look in the documentation of the API. 

## SmallBag

The SmallBag provides a lot of different services, e.g., cryptographical tools, access to your services, error creation, information of your server, channel tools, worker variables, socket tools and many more. 
It's like a big toolbox which provides information and tools. 
You will often get a SmallBag as a parameter of events. 

## Bag

The Bag is an extension of the SmallBag, that means that the Bag can do whatever the SmallBag can.
But the Bag is bound to a request and a client, so there are new functions which depends on the request or the client. 
For example, you can get information about the client or the request.