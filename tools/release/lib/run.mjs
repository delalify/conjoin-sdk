import { spawnSync } from 'node:child_process'

export class CommandError extends Error {
  constructor(command, args, result) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || 'no output'
    super(`Command failed: ${command} ${args.join(' ')}\n${detail}`)
    this.name = 'CommandError'
    this.code = 'COMMAND_FAILED'
    this.command = command
    this.args = args
    this.status = result.status
    this.signal = result.signal
  }
}

/**
 * Runs a command with an explicit argument vector and no shell, so untrusted
 * values (version inputs, commit subjects) can never be interpreted by a shell.
 */
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  })

  if (result.error) {
    throw new CommandError(command, args, {
      stderr: result.error.message,
      status: null,
    })
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new CommandError(command, args, result)
  }

  if (result.signal) {
    throw new CommandError(command, args, result)
  }

  return result.stdout ?? ''
}

/**
 * Runs a command and returns the trimmed stdout together with the exit status
 * without throwing, for callers that need to branch on a non-zero status
 * (probing whether a tag or release already exists).
 */
export function tryRun(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  })

  if (result.error) {
    return { ok: false, status: null, stdout: '', stderr: result.error.message }
  }

  return {
    ok: result.status === 0 && !result.signal,
    status: result.status,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  }
}
