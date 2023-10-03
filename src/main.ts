import * as core from '@actions/core'
import got from 'got'
import yaml from 'js-yaml'

/** Supported push message format https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b */
enum MsgType {
  Text = 'text',
  Post = 'post',
  Image = 'image',
  ShareChat = 'share_chat',
  Interactive = 'interactive',
  GithubIssue = 'github_issue'
}

/** Message */
interface Message {
  msg_type: string
  content: any
}

/** Interactive Message, for interactive msg_type */
interface InteractiveMessage {
  msg_type: string
  card: any
}

/** Send text/post/image/sharechat message */
async function postNormalMessage(
  msg_type: MsgType,
  content: string
): Promise<string> {
  return await post({
    msg_type,
    content: yaml.load(content)
  })
}

/** Send interactive message */
async function postInteractiveMessage(
  msg_type: MsgType,
  cardContent: string
): Promise<string> {
  const card = yaml.load(cardContent)
  return await post({
    msg_type,
    card: yaml.load(cardContent)
  })
}

async function postIssueMessage(
  msg_type: MsgType,
  cardContent: string
): Promise<string> {
  const title = core.getInput('issue_title')
  const body = core.getInput('issue_body')
  const link_url = core.getInput('issue_link_url')

  const new_msg_type = "interactive" as MsgType

  core.debug("body is: " + body)
  console.log("=== body is: " + body)

  return await post({
    msg_type: new_msg_type,
    card: {
      header: {
        title: {
          content: title,
          tag: "plain_text"
        },
        template: "blue",
      },
      elements: [
        {
          tag: "markdown",
          content: body,
        }
      ]
    }
  })
}

async function postMessage(): Promise<string> {
  const msg_type = core.getInput('msg_type') as MsgType
  const content: string = core.getInput('content')

  core.debug("get msg_type: " + msg_type)
  switch (msg_type) {
    case MsgType.Text:
    case MsgType.Post:
    case MsgType.Image:
    case MsgType.ShareChat:
      return await postNormalMessage(msg_type, content)
    case MsgType.Interactive:
      return await postInteractiveMessage(msg_type, content)
    case MsgType.GithubIssue:
      return await postIssueMessage(msg_type, content)
    default:
      // fallback
      return await postNormalMessage(msg_type, content)
  }
}

async function post(body: Message | InteractiveMessage): Promise<string> {
  const url: string = core.getInput('url')
  core.debug("=====post body: " + JSON.stringify(body))
  const rsp = await got.post(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  core.debug("======resp")
  core.debug(rsp.body)
  return rsp.body
}

async function run(): Promise<void> {
  core.setCommandEcho(true)
  try {
    await postMessage()
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
