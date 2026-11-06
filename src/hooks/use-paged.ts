import { useState } from 'react'

/** 列表分页：页码越界自动收敛（过滤后数据变少时回到最后一页） */
export function usePaged<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)
  return {
    page: safePage,
    setPage,
    total: items.length,
    pageSize,
    paged: items.slice((safePage - 1) * pageSize, safePage * pageSize),
  }
}
