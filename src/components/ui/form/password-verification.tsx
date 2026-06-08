'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/interaction/dialog'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { Button } from '@/components/ui/basic/button'

interface PasswordVerificationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function PasswordVerification({
  isOpen,
  onClose,
  onSuccess,
  title = "操作验证",
  description = "为保护数据安全，请输入操作密码"
}: PasswordVerificationProps) {
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handlePasswordSubmit = () => {
    if (password === 'csch903') {
      setPassword('')
      setPasswordError('')
      onSuccess()
      onClose()
    } else {
      setPasswordError('密码错误，请重新输入')
      setPassword('')
    }
  }

  const handlePasswordCancel = () => {
    setPassword('')
    setPasswordError('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit()
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handlePasswordCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              密码
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="col-span-3"
              placeholder="请输入操作密码"
              autoFocus
            />
          </div>
          {passwordError && (
            <div className="text-center text-sm text-destructive">
              {passwordError}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handlePasswordCancel}>
            取消
          </Button>
          <Button onClick={handlePasswordSubmit}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
