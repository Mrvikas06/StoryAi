#!/usr/bin/env node
/**
 * Pre-Deployment Health Check Script
 * Validates that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function log(type, message) {
  const symbols = {
    pass: '✅',
    fail: '❌',
    warn: '⚠️'
  };
  console.log(`${symbols[type]} ${message}`);
}

function check(name, fn) {
  try {
    if (fn()) {
      checks.passed.push(name);
      log('pass', name);
    } else {
      checks.failed.push(name);
      log('fail', name);
    }
  } catch (err) {
    checks.failed.push(name);
    log('fail', `${name}: ${err.message}`);
  }
}

function warn(name, message) {
  checks.warnings.push(name);
  log('warn', `${name}: ${message}`);
}

console.log('\n🔍 Pre-Deployment Health Check\n');

// Check Node version
check('Node.js version', () => {
  const version = parseInt(process.version.slice(1).split('.')[0]);
  return version >= 18;
});

// Check required files
check('Backend package.json exists', () => 
  fs.existsSync(path.join(__dirname, '../backend/package.json'))
);

check('Frontend package.json exists', () => 
  fs.existsSync(path.join(__dirname, '../frontend/package.json'))
);

check('Root server.js exists', () => 
  fs.existsSync(path.join(__dirname, '../server.js'))
);

check('render.yaml exists', () => 
  fs.existsSync(path.join(__dirname, '../render.yaml'))
);

check('wrangler.toml exists', () => 
  fs.existsSync(path.join(__dirname, '../wrangler.toml'))
);

check('.env.example exists', () => 
  fs.existsSync(path.join(__dirname, '../backend/.env.example'))
);

// Check .gitignore
check('.gitignore configured', () => {
  const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
  return gitignore.includes('.env') && gitignore.includes('node_modules');
});

// Check dependencies
check('Backend dependencies listed', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/package.json'), 'utf8'));
  return pkg.dependencies && 
    pkg.dependencies.express && 
    pkg.dependencies['groq-sdk'];
});

check('Frontend dependencies listed', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/package.json'), 'utf8'));
  return pkg.dependencies && 
    pkg.dependencies.react && 
    pkg.dependencies.axios;
});

// Check API routes
check('API routes configured', () => {
  return fs.existsSync(path.join(__dirname, '../backend/routes/story.js')) &&
    fs.existsSync(path.join(__dirname, '../backend/routes/tts.js'));
});

// Check frontend config
check('Vite config exists', () =>
  fs.existsSync(path.join(__dirname, '../frontend/vite.config.js'))
);

check('Frontend components exist', () =>
  fs.existsSync(path.join(__dirname, '../frontend/src/components/StoryDisplay.jsx')) &&
  fs.existsSync(path.join(__dirname, '../frontend/src/components/WordInput.jsx'))
);

// Check optional files
warn('Dockerfile exists', 
  fs.existsSync(path.join(__dirname, '../Dockerfile')) ? 
    'Ready for Docker deployment' : 
    'Docker support not configured (optional)'
);

warn('Environment example exists',
  fs.existsSync(path.join(__dirname, '../backend/.env.example')) ?
    'API keys documented' :
    'Add .env.example for documentation'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);
console.log(`⚠️  Warnings: ${checks.warnings.length}`);
console.log('='.repeat(50));

if (checks.failed.length === 0) {
  console.log('\n🎉 Application is ready for deployment!\n');
  console.log('Next steps:');
  console.log('1. Verify API keys in backend/.env');
  console.log('2. Test locally: npm run dev (backend) & npm run dev (frontend)');
  console.log('3. Push to GitHub: git push origin main');
  console.log('4. Deploy to Render: https://render.com/dashboard');
  console.log('5. See DEPLOYMENT.md for detailed instructions\n');
  process.exit(0);
} else {
  console.log('\n❌ Please fix the failed checks before deploying.\n');
  process.exit(1);
}
