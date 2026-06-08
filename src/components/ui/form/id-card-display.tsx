'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/basic/button'
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

interface IdCardDisplayProps {
  idCard: string
  className?: string
}

export function IdCardDisplay({ idCard, className = '' }: IdCardDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 隐藏身份证中间部分
  const maskIdCard = (id: string) => {
    if (!id || id.length < 8) return id
    const start = id.slice(0, 6)
    const end = id.slice(-4)
    const middle = '*'.repeat(id.length - 10)
    return `${start}${middle}${end}`
  }

  const handleEyeClick = () => {
    if (isVisible) {
      // 如果当前是显示状态，直接隐藏
      setIsVisible(false)
    } else {
      // 如果当前是隐藏状态，显示密码输入框
      setShowPasswordDialog(true)
      setPassword('')
      setPasswordError('')
    }
  }

  const handlePasswordSubmit = () => {
    if (password === 'csch903') {
      setIsVisible(true)
      setShowPasswordDialog(false)
      setPassword('')
      setPasswordError('')
    } else {
      setPasswordError('密码错误，请重新输入')
      setPassword('')
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false)
    setPassword('')
    setPasswordError('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit()
    }
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-mono text-sm">
          {isVisible ? idCard : maskIdCard(idCard)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEyeClick}
          className="h-6 w-6 p-0"
          title={isVisible ? '隐藏身份证号' : '查看身份证号'}
        >
          {isVisible ? (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Eye className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>身份证信息查看验证</DialogTitle>
            <DialogDescription>
              为保护隐私信息，请输入查看密码
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
                placeholder="请输入查看密码"
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
    </>
  )
}
