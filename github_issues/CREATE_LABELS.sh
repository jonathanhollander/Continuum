#!/bin/bash

# Create GitHub labels for Continuum project
# Run this once to set up labels, then use CREATE_ISSUES.sh

echo "Creating GitHub labels for issue organization..."

# Priority labels
gh label create "P0-critical" --color "d73a4a" --description "Critical - must be done immediately" --force
gh label create "P1-high" --color "ff6b6b" --description "High priority - next 2 weeks" --force
gh label create "P2-testing" --color "ffa500" --description "Testing and quality - weeks 3-4" --force
gh label create "P3-polish" --color "ffeb3b" --description "Polish and optimization - week 5+" --force

# Category labels
gh label create "authentication" --color "0052cc" --description "Authentication and authorization" --force
gh label create "data-persistence" --color "0e8a16" --description "Database and data storage" --force
gh label create "media" --color "8b4513" --description "File uploads and media storage" --force
gh label create "email" --color "1d76db" --description "Email service integration" --force
gh label create "emotional-tone" --color "e99695" --description "UX tone and compassionate language" --force
gh label create "configuration" --color "5319e7" --description "Configuration management" --force
gh label create "security" --color "d93f0b" --description "Security hardening" --force
gh label create "monitoring" --color "006b75" --description "Logging, monitoring, error tracking" --force
gh label create "testing" --color "fbca04" --description "Unit, E2E, integration tests" --force
gh label create "documentation" --color "0075ca" --description "Developer and API documentation" --force
gh label create "deployment" --color "5319e7" --description "Deployment and DevOps" --force
gh label create "integration" --color "1d76db" --description "Frontend/backend integration" --force
gh label create "backend" --color "0e8a16" --description "Backend/Python work" --force
gh label create "frontend" --color "0052cc" --description "Frontend/TypeScript/Svelte work" --force
gh label create "e2e" --color "fbca04" --description "End-to-end testing" --force
gh label create "offline" --color "006b75" --description "PWA and offline functionality" --force
gh label create "performance" --color "ff6b6b" --description "Performance optimization" --force
gh label create "automation" --color "5319e7" --description "CI/CD and automation" --force
gh label create "api" --color "1d76db" --description "API design and standards" --force
gh label create "type-safety" --color "0052cc" --description "TypeScript/Python typing" --force

echo "✅ All labels created successfully!"
echo ""
echo "Next steps:"
echo "1. Review labels at: https://github.com/jonathanhollander/Continuum/labels"
echo "2. Run ./CREATE_ISSUES.sh to create all 36 issues"
