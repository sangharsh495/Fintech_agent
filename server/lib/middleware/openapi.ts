import { z } from "zod"
import type { NextRequest, NextResponse } from "next/server"

/**
 * OpenAPI 3.1 documentation generator
 * Auto-generates API documentation from Zod schemas
 */

export interface OpenAPISpec {
  openapi: "3.1.0"
  info: InfoObject
  servers: ServerObject[]
  paths: PathsObject
  components: ComponentsObject
  tags: TagObject[]
  security: SecurityRequirementObject[]
}

export interface InfoObject {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
}

export interface ContactObject {
  name?: string
  url?: string
  email?: string
}

export interface LicenseObject {
  name: string
  url?: string
}

export interface ServerObject {
  url: string
  description?: string
  variables?: Record<string, ServerVariableObject>
}

export interface ServerVariableObject {
  enum?: string[]
  default: string
  description?: string
}

export interface PathsObject {
  [path: string]: PathItemObject
}

export interface PathItemObject {
  summary?: string
  description?: string
  get?: OperationObject
  post?: OperationObject
  put?: OperationObject
  patch?: OperationObject
  delete?: OperationObject
  options?: OperationObject
  head?: OperationObject
  trace?: OperationObject
  parameters?: ParameterObject[]
}

export interface OperationObject {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses: ResponsesObject
  callbacks?: Record<string, CallbackObject>
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  servers?: ServerObject[]
}

export interface ExternalDocumentationObject {
  description?: string
  url: string
}

export interface ParameterObject {
  name: string
  in: "query" | "header" | "path" | "cookie"
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: SchemaObject
  example?: unknown
  examples?: Record<string, ExampleObject>
  content?: Record<string, MediaTypeObject>
}

export interface ExampleObject {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
}

export interface RequestBodyObject {
  description?: string
  content: Record<string, MediaTypeObject>
  required?: boolean
}

export interface MediaTypeObject {
  schema?: SchemaObject
  example?: unknown
  examples?: Record<string, ExampleObject>
  encoding?: Record<string, EncodingObject>
}

export interface EncodingObject {
  contentType?: string
  headers?: Record<string, HeaderObject>
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

export interface HeaderObject {
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: SchemaObject
  example?: unknown
  examples?: Record<string, ExampleObject>
}

export interface ResponsesObject {
  [code: string]: ResponseObject | ReferenceObject
}

export interface ResponseObject {
  description: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
  links?: Record<string, LinkObject | ReferenceObject>
}

export interface LinkObject {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, unknown>
  requestBody?: unknown
  description?: string
  server?: ServerObject
}

export interface CallbackObject {
  [url: string]: PathItemObject
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject | ReferenceObject>
  responses?: Record<string, ResponseObject | ReferenceObject>
  parameters?: Record<string, ParameterObject | ReferenceObject>
  examples?: Record<string, ExampleObject | ReferenceObject>
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>
  headers?: Record<string, HeaderObject | ReferenceObject>
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  links?: Record<string, LinkObject | ReferenceObject>
  callbacks?: Record<string, CallbackObject | ReferenceObject>
}

export interface SecuritySchemeObject {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect"
  description?: string
  name?: string
  in?: string
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlowsObject
  openIdConnectUrl?: string
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
}

export interface OAuthFlowObject {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface SecurityRequirementObject {
  [name: string]: string[]
}

export interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
}

export interface ReferenceObject {
  $ref: string
}

/**
 * Schema object - simplified version compatible with Zod
 */
export interface SchemaObject {
  type?: string
  allOf?: (SchemaObject | ReferenceObject)[]
  oneOf?: (SchemaObject | ReferenceObject)[]
  anyOf?: (SchemaObject | ReferenceObject)[]
  not?: SchemaObject | ReferenceObject
  items?: SchemaObject | ReferenceObject
  properties?: Record<string, SchemaObject | ReferenceObject>
  additionalProperties?: boolean | SchemaObject | ReferenceObject
  required?: string[]
  enum?: unknown[]
  const?: unknown
  nullable?: boolean
  discriminator?: DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XMLObject
  externalDocs?: ExternalDocumentationObject
  example?: unknown
  deprecated?: boolean
  title?: string
  description?: string
  default?: unknown
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
}

export interface DiscriminatorObject {
  propertyName: string
  mapping?: Record<string, string>
}

export interface XMLObject {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

/**
 * Convert Zod schema to OpenAPI schema
 */
export function zodToOpenAPI(schema: z.ZodSchema, name?: string): SchemaObject {
  const def = schema._def
  
  switch (def.typeName) {
    case "ZodString": {
      const checks = def.checks || []
      const schemaObj: SchemaObject = { type: "string" }
      
      for (const check of checks) {
        switch (check.kind) {
          case "email":
            schemaObj.format = "email"
            break
          case "uuid":
            schemaObj.format = "uuid"
            break
          case "regex":
            schemaObj.pattern = check.regex.source
            break
          case "min":
            schemaObj.minLength = check.value
            break
          case "max":
            schemaObj.maxLength = check.value
            break
        }
      }
      return schemaObj
    }
    
    case "ZodNumber": {
      const checks = def.checks || []
      const schemaObj: SchemaObject = { type: "number" }
      
      for (const check of checks) {
        switch (check.kind) {
          case "min":
            schemaObj.minimum = check.value
            schemaObj.exclusiveMinimum = check.inclusive === false
            break
          case "max":
            schemaObj.maximum = check.value
            schemaObj.exclusiveMaximum = check.inclusive === false
            break
          case "int":
            schemaObj.type = "integer"
            break
          case "positive":
            schemaObj.minimum = 0
            schemaObj.exclusiveMinimum = true
            break
        }
      }
      return schemaObj
    }
    
    case "ZodBoolean":
      return { type: "boolean" }
    
    case "ZodArray": {
      const itemSchema = zodToOpenAPI(def.type)
      return {
        type: "array",
        items: itemSchema,
        minItems: def.minLength?.value,
        maxItems: def.maxLength?.value,
      }
    }
    
    case "ZodObject": {
      const shape = def.shape()
      const properties: Record<string, SchemaObject> = {}
      const required: string[] = []
      
      for (const [key, value] of Object.entries(shape)) {
        const zodSchema = value as z.ZodSchema
        properties[key] = zodToOpenAPI(zodSchema)
        
        // Check if required (not optional, not nullable)
        const valueDef = zodSchema._def
        if (valueDef.typeName !== "ZodOptional" && valueDef.typeName !== "ZodNullable") {
          required.push(key)
        }
      }
      
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: def.catchall ? zodToOpenAPI(def.catchall) : false,
      }
    }
    
    case "ZodOptional": {
      const inner = zodToOpenAPI(def.innerType)
      inner.nullable = true
      return inner
    }
    
    case "ZodNullable": {
      const inner = zodToOpenAPI(def.innerType)
      inner.nullable = true
      return inner
    }
    
    case "ZodDefault": {
      const inner = zodToOpenAPI(def.innerType)
      inner.default = def.defaultValue()
      return inner
    }
    
    case "ZodEnum": {
      return {
        type: "string",
        enum: def.values,
      }
    }
    
    case "ZodNativeEnum": {
      return {
        type: "string",
        enum: Object.values(def.enum),
      }
    }
    
    case "ZodUnion": {
      return {
        anyOf: def.options.map((opt) => zodToOpenAPI(opt)),
      }
    }
    
    case "ZodEffects": {
      // For refinements/transformations, just use inner schema
      return zodToOpenAPI(def.schema)
    }
    
    default:
      return { type: "object" }
  }
}

/**
 * Generate OpenAPI spec from route definitions
 */
export function generateOpenAPISpec(
  routes: RouteDefinition[],
  info: InfoObject,
  servers: ServerObject[] = [{ url: "/api", description: "Current server" }]
): OpenAPISpec {
  const paths: PathsObject = {}
  const schemas: Record<string, SchemaObject> = {}
  const securitySchemes: Record<string, SecuritySchemeObject> = {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT token from NextAuth or mobile auth",
    },
    apiKey: {
      type: "apiKey",
      in: "header",
      name: "X-API-Key",
      description: "API key for service-to-service communication",
    },
  }
  
  const tagsSet = new Set<string>()
  
  for (const route of routes) {
    const path = route.path
    const method = route.method.toLowerCase()
    
    if (!paths[path]) {
      paths[path] = {}
    }
    
    // Register schemas
    if (route.requestBody) {
      const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Request`
      schemas[schemaName] = zodToOpenAPI(route.requestBody)
    }
    
    if (route.responses) {
      for (const [status, response] of Object.entries(route.responses)) {
        if (response.schema) {
          const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Response${status}`
          schemas[schemaName] = zodToOpenAPI(response.schema)
        }
      }
    }
    
    if (route.query) {
      const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Query`
      schemas[schemaName] = zodToOpenAPI(route.query)
    }
    
    if (route.params) {
      const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Params`
      schemas[schemaName] = zodToOpenAPI(route.params)
    }
    
    // Build operation
    const operation: OperationObject = {
      tags: route.tags,
      summary: route.summary,
      description: route.description,
      operationId: route.operationId || `${route.method.toLowerCase()}${path.replace(/[^a-zA-Z0-9]/g, "")}`,
      parameters: [],
      responses: {},
      security: route.auth ? [{ bearerAuth: [] }] : [],
    }
    
    if (route.tags) {
      for (const tag of route.tags) {
        tagsSet.add(tag)
      }
    }
    
    // Add path parameters
    if (route.params) {
      const paramSchema = zodToOpenAPI(route.params)
      if (paramSchema.properties) {
        for (const [name, schema] of Object.entries(paramSchema.properties)) {
          operation.parameters!.push({
            name,
            in: "path",
            required: true,
            schema: schema as SchemaObject,
          })
        }
      }
    }
    
    // Add query parameters
    if (route.query) {
      const querySchema = zodToOpenAPI(route.query)
      if (querySchema.properties) {
        for (const [name, schema] of Object.entries(querySchema.properties)) {
          const isRequired = querySchema.required?.includes(name) ?? false
          operation.parameters!.push({
            name,
            in: "query",
            required: isRequired,
            schema: schema as SchemaObject,
          })
        }
      }
    }
    
    // Add request body
    if (route.requestBody) {
      const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Request`
      operation.requestBody = {
        description: route.requestBodyDescription || "Request body",
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      }
    }
    
    // Add responses
    if (route.responses) {
      for (const [status, response] of Object.entries(route.responses)) {
        const responseObj: ResponseObject = {
          description: response.description || "Response",
        }
        
        if (response.schema) {
          const schemaName = `${route.method}${path.replace(/[^a-zA-Z0-9]/g, "")}Response${status}`
          responseObj.content = {
            "application/json": {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          }
        }
        
        operation.responses[status] = responseObj
      }
    }
    
    // Add default error responses
    if (!operation.responses["400"]) {
      operation.responses["400"] = {
        description: "Bad Request - Validation Error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      }
    }
    
    if (!operation.responses["401"]) {
      operation.responses["401"] = {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      }
    }
    
    if (!operation.responses["500"]) {
      operation.responses["500"] = {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      }
    }
    
    paths[path][method as keyof PathItemObject] = operation
  }
  
  // Add common error schema
  schemas.ErrorResponse = {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [false] },
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "object" },
          timestamp: { type: "string", format: "date-time" },
          requestId: { type: "string" },
        },
        required: ["code", "message", "timestamp", "requestId"],
      },
    },
    required: ["success", "error"],
  }
  
  return {
    openapi: "3.1.0",
    info,
    servers,
    paths,
    components: {
      schemas,
      securitySchemes,
    },
    tags: Array.from(tagsSet).map((name) => ({ name })),
    security: [{ bearerAuth: [] }],
  }
}

/**
 * Route definition for OpenAPI generation
 */
export interface RouteDefinition {
  path: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  auth?: boolean
  params?: z.ZodSchema
  query?: z.ZodSchema
  requestBody?: z.ZodSchema
  requestBodyDescription?: string
  responses?: Record<
    string,
    {
      description: string
      schema?: z.ZodSchema
    }
  >
}

/**
 * Serve OpenAPI spec as JSON
 */
export function serveOpenAPISpec(spec: OpenAPISpec) {
  return async (req: NextRequest): Promise<NextResponse> => {
    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    })
  }
}

/**
 * Serve Swagger UI
 */
export function serveSwaggerUI(specUrl: string = "/api/docs/openapi.json") {
  return async (req: NextRequest): Promise<NextResponse> => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FinFlow API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.9.9.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      })
      window.ui = ui
    }
  </script>
</body>
</html>`
    
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  }
}

/**
 * Common API info
 */
export const apiInfo: InfoObject = {
  title: "FinFlow API",
  version: "1.0.0",
  description: "Personal finance management API with transaction parsing, analytics, and AI insights",
  contact: {
    name: "FinFlow Team",
    email: "support@finflow.app",
  },
  license: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
}