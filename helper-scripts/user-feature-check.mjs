import 'dotenv/config'
import { FliptEvaluationClient } from '@flipt-io/flipt-client'

async function main() {
  const namespace = process.env.FLIPT_NAMESPACE

  try {
    const fliptEvaluationClient = await FliptEvaluationClient.init(namespace, {
      url: process.env.FLIPT_CHECK_URL,
      authentication: {
        clientToken: process.env.FLIPT_CHECK_TOKEN,
      },
    })

    console.log("Flipt client initialized")

    const flagKey = process.env.FLIPT_FLAG
    const entityId = process.env.FLIPT_ENTITY_ID
    const contextField = process.env.FLIPT_CONTEXT_FIELD

    const context = {
      [contextField]: entityId,
    }

    console.log(`${flagKey} flag evaluation for entity ${entityId} with context:`, context)
    const result = fliptEvaluationClient.evaluateBoolean(flagKey, entityId, context)

    console.log('Evaluation result:', result)
  } catch (err) {
    console.error('Error initializing Flipt client:', err)
  }
}

main()