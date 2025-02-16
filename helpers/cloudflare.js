var cloudFlare = async function (request) {
  const body = request.body;
  
  // Turnstile injects a token in "cf-turnstile-response".
  const token = body['cf-turnstile-response'];
  const ip = request.headers['CF-Connecting-IP'];

  // Get the secret key from the .env
  const SECRET_KEY = process.env.CLOUDFLARE_SECRET_KEY;
 
  // Validate the token by calling the "/siteverify" API endpoint.
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
    body: JSON.stringify({
      secret: SECRET_KEY,
      response: token,
      remoteip: ip
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const outcome = await result.json();
  return outcome.success;
}

module.exports = cloudFlare;
