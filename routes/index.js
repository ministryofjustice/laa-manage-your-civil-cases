import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('main/index');
});

// Make an API call with `Axios` and `middleware-axios`
// GET users from external API
router.get('/users', async (req, res, next) => {
  try {
      // Use the Axios instance attached to the request object
      const response = await req.axiosMiddleware.get('https://jsonplaceholder.typicode.com/users');
      res.json(response.data);
  } catch (error) {
      next(error);
  }
});

// liveness and readiness probes for Kubernetes and Helm deployments
router.get('/status', (req, res) => res.status(200).send('OK'));
router.get('/health', (req, res) => res.status(200).send('Healthy'));

export default router;
