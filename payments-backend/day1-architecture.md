Customer --> React frontend --> Express backend --> Daraja API --> Customer's phone
<-- callback <-- Daraja

1. Why Daraja calls your server and not the other way around?
   ANS: Daraja calls my server because the payment happens on the customer's phone. My server only starts the request. Safaricom knows when the customer finishes, so they call me with the result.

2.Why you need ngrok (or a real server) for the callback?
ANS: My laptop is on a private network. Safaricom cannot reach localhost. Ngrok gives me a public URL that forwards requests to my machine, so Safaricom can send the callback.

3. What would happen if you lost the callback ?
   ANS:If my server misses the callback, the customer still pays, but my database never updates. The link stays 'pending'. No receipt is generated. The business owner would think the client didn't pay, causing confusion and potential double-charging.
