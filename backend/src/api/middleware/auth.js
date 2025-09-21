const { createAnonClient } = require('../../config/supabase');

const buildUnauthorizedResponse = (res, message = 'Token de autenticação ausente ou inválido') =>
  res.status(401).json({
    success: false,
    message
  });

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return buildUnauthorizedResponse(res, 'Cabeçalho Authorization não informado');
  }

  const [scheme, token] = authHeader.split(' ');

  if (!scheme || !token || !/^Bearer$/i.test(scheme)) {
    return buildUnauthorizedResponse(res, 'Formato do token inválido');
  }

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return buildUnauthorizedResponse(res, 'Token inválido ou expirado');
    }

    const { user } = data;
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};

    req.user = {
      id: user.id,
      email: user.email,
      role: userMetadata.role || appMetadata.role || null,
      metadata: {
        ...appMetadata,
        ...userMetadata
      },
      supabaseUser: user
    };

    return next();
  } catch (err) {
    console.error('Erro ao validar token com o Supabase:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro na validação do token de autenticação',
      error: err.message
    });
  }
};
