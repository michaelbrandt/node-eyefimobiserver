# node-eyefimobiserver
A standalone Eye-Fi server in Node.js for the "Mobi" series

**What is Eye-Fi?**

Eye-Fi memory cards send your pictures from camera to smartphones, tablets or desktop over wifi. Read more about Eye-Fi at http://eye.fi

**What is the problem?**

There are several implementations for this but none I've seen worked with the "Mobi" series. Why not? While the "ProX2" series seems to have an upload key, the "Mobi" series doesn't. Computing the credentials for authentication is a bit different between these two series. Based on the work of Maximilian Golla I was able to write my own Eye-Fi Server.

**For what reason?**

Creating something like a photobox for the wedding of my brother, took me to the point, where i had to automate the process of transfering pictures and showing them on a big screen. 

**Others work:**

My starting point how the card works:
  https://code.google.com/p/sceye-fi/wiki/UploadProtocol

The work of Maximilian Golla can be seen in the repository
