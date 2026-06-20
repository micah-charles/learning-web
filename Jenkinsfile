/*
 * Jenkinsfile — Multibranch Pipeline for learning-web
 *
 * PR / non-main branches:
 *   npm ci → build → QA config-check → QA smoke
 *   NOT deployed
 *
 * main branch:
 *   npm ci → build → deploy (port 4173) → full QA against deployed site
 *   Lockable Resources prevents concurrent deployments
 */

def DEPLOY_PORT = "4173"
def DEPLOY_HOST = "127.0.0.1"
def DEPLOY_URL = "http://${DEPLOY_HOST}:${DEPLOY_PORT}"

pipeline {
    agent any

    options {
        // timestamps() — requires Timestamper plugin, install manually if wanted
        buildDiscarder(logRotator(numToKeepStr: "10", artifactNumToKeepStr: "3"))
    }

    environment {
        PATH = "/opt/homebrew/bin:${env.PATH}"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }

        stage("Install dependencies") {
            steps {
                sh "npm ci"
            }
        }

        stage("Build") {
            steps {
                sh "npm run build"
            }
        }

        stage("QA: Config Check") {
            steps {
                sh "npm run qa:config-check"
            }
        }

        stage("QA: Smoke") {
            steps {
                sh "npm run qa:smoke"
            }
        }

        stage("Deploy + Full QA") {
            when {
                branch "main"
            }
            steps {
                lock("learning-web-deploy") {
                    sh """
                        echo "=== Deploying learning-web to ${DEPLOY_URL} ==="
                        JENKINS_NODE_COOKIE=dontKillMe bash scripts/deploy-local.sh
                    """

                    sh """
                        echo "=== Running QA against deployed site ==="
                        QA_USE_LOCAL_SERVER=false \
                        QA_BASE_URL=${DEPLOY_URL} \
                        npm run qa:smoke
                    """

                    sh """
                        QA_USE_LOCAL_SERVER=false \
                        QA_BASE_URL=${DEPLOY_URL} \
                        npm run qa:data-sample
                    """
                }
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check logs for details."
        }
        aborted {
            echo "Pipeline was aborted."
        }
    }
}
