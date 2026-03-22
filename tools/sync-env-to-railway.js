/**
 * Sync .env file to Railway Environment Variables
 * Usage: node tools/sync-env-to-railway.js
 * 
 * This script reads your local .env file and updates Railway environment variables.
 * Requires: RAILWAY_API_TOKEN and RAILWAY_PROJECT_ID in .env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

// Load .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = dotenv.parse(envContent);

// Railway API endpoint
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

// Variables to sync (add/remove as needed)
const VARS_TO_SYNC = [
  'MONGODB_URI',
  'PORT',
  'NODE_ENV',
  'MONGODB_DB',
  'MONGODB_BMI_DB',
  'CUSTOMER_NAME',
  'CLIENT_RUN_NUMBER',
  'CLIENT_CONTRACT_NO',
  'CLIENT_INSTALL_DATE',
  'CLIENT_EXPIRY_DATE',
  'RAILWAY_PROJECT_NAME'
];

async function getServiceId(projectId, apiToken) {
  const query = `
    query GetProject($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
            }
          }
        }
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
    body: JSON.stringify({
      query,
      variables: { projectId }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Railway API Error: ${JSON.stringify(data.errors)}`);
  }

  const services = data.data.project.services.edges;
  const environments = data.data.project.environments.edges;
  
  console.log('\n📦 Services found:');
  services.forEach(s => console.log(`   - ${s.node.name} (${s.node.id})`));
  
  console.log('\n🌍 Environments found:');
  environments.forEach(e => console.log(`   - ${e.node.name} (${e.node.id})`));

  // Return first service and production environment (or first env)
  const service = services[0]?.node;
  const prodEnv = environments.find(e => 
    e.node.name.toLowerCase().includes('production') || 
    e.node.name.toLowerCase().includes('prod')
  )?.node || environments[0]?.node;

  return { serviceId: service?.id, environmentId: prodEnv?.id };
}

async function upsertVariables(projectId, environmentId, serviceId, variables, apiToken) {
  const mutation = `
    mutation UpsertVariables($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `;

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          projectId,
          environmentId,
          serviceId,
          variables
        }
      }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Railway API Error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.variableCollectionUpsert;
}

async function main() {
  console.log('🚂 Railway Environment Sync Tool\n');
  console.log('=' .repeat(50));

  const apiToken = envVars.RAILWAY_API_TOKEN;
  const projectId = envVars.RAILWAY_PROJECT_ID;

  if (!apiToken || !projectId) {
    console.error('❌ Error: RAILWAY_API_TOKEN and RAILWAY_PROJECT_ID must be set in .env');
    process.exit(1);
  }

  console.log(`\n📂 Reading from: ${envPath}`);
  console.log(`🎯 Project ID: ${projectId}`);

  try {
    // Get service and environment IDs
    const { serviceId, environmentId } = await getServiceId(projectId, apiToken);
    
    if (!serviceId || !environmentId) {
      console.error('❌ Could not find service or environment');
      process.exit(1);
    }

    console.log(`\n🔧 Using Service: ${serviceId}`);
    console.log(`🌍 Using Environment: ${environmentId}`);

    // Prepare variables to sync
    const varsToUpdate = {};
    console.log('\n📝 Variables to sync:');
    
    for (const key of VARS_TO_SYNC) {
      if (envVars[key] !== undefined && envVars[key] !== '') {
        varsToUpdate[key] = envVars[key];
        // Mask sensitive values
        const displayValue = key.includes('TOKEN') || key.includes('URI') || key.includes('PASSWORD')
          ? '****' + envVars[key].slice(-8)
          : envVars[key];
        console.log(`   ✓ ${key} = ${displayValue}`);
      } else {
        console.log(`   ⚠ ${key} (empty or not set, skipping)`);
      }
    }

    // Confirm before syncing
    console.log('\n' + '='.repeat(50));
    console.log('⚡ Syncing variables to Railway...\n');

    const result = await upsertVariables(projectId, environmentId, serviceId, varsToUpdate, apiToken);
    
    if (result) {
      console.log('✅ Variables synced successfully!');
      console.log('🔄 Railway will automatically redeploy with new variables.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
