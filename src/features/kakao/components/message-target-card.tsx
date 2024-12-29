"use client";

import { useState, useTransition, useOptimistic } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { deleteMessageTarget } from "@/features/kakao/actions/delete-message-target";
import { updateMessageTarget } from "@/features/kakao/actions/update-message-target";

export function MessageTargetsCards({
  messageTargets,
  projectSlug,
}: {
  messageTargets: {
    id: string;
    phone_number: string | null;
    active: boolean;
    created_at: string;
    profile_id: string | null;
    project_id: string | null;
  }[];
  projectSlug: string;
}) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [optimisticMessageTargets, setOptimisticMessageTargets] = useOptimistic(
    messageTargets,
    (
      state,
      {
        id,
        phone_number,
        active,
      }: { id: string; phone_number?: string; active?: boolean }
    ) =>
      state.map((target) => {
        if (target.id === id) {
          return {
            ...target,
            ...(phone_number ? { phone_number } : {}),
            ...(active !== undefined ? { active } : {}),
          };
        }
        return target;
      })
  );

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingIds((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string, phoneNumber: string) => {
    setLoading(id, true);
    try {
      await deleteMessageTarget(
        projectSlug,
        phoneNumber,
        `/${projectSlug}/setting`
      );
    } catch (error) {
      console.error("Error deleting message target:", error);
    } finally {
      setLoading(id, false);
    }
  };

  const handleUpdatePhoneNumber = async (
    id: string,
    newPhoneNumber: string
  ) => {
    setLoading(id, true);
    startTransition(() => {
      setOptimisticMessageTargets({ id, phone_number: newPhoneNumber });
    });

    try {
      await updateMessageTarget(
        projectSlug,
        newPhoneNumber,
        { phone_number: newPhoneNumber },
        `/${projectSlug}/setting`
      );
    } catch (error) {
      console.error("Error updating phone number:", error);
      startTransition(() => {
        const originalTarget = messageTargets.find((t) => t.id === id);
        if (originalTarget) {
          setOptimisticMessageTargets({
            id,
            phone_number: originalTarget.phone_number ?? "",
          });
        }
      });
    } finally {
      setLoading(id, false);
    }
  };

  const handleUpdateActive = async (id: string, newActive: boolean) => {
    const target = messageTargets.find((t) => t.id === id);

    if (!target?.phone_number) {
      console.error(`Target with id ${id} does not have a phone number.`);
      return;
    }

    setLoading(id, true);
    startTransition(() => {
      setOptimisticMessageTargets({ id, active: newActive });
    });

    try {
      await updateMessageTarget(
        projectSlug,
        target.phone_number, // 기존 전화번호를 전달
        { active: newActive },
        `/${projectSlug}/setting`
      );
    } catch (error) {
      console.error("Error updating active status:", error);
      startTransition(() => {
        setOptimisticMessageTargets({ id, active: !newActive });
      });
    } finally {
      setLoading(id, false);
    }
  };

  return (
    <ul className="space-y-3 w-40">
      {optimisticMessageTargets.map((target) => (
        <li
          key={target.id}
          className="flex justify-between items-center border-b last:border-b-0 py-2"
        >
          <div className="flex flex-col gap-1">
            <Input
              type="text"
              variant="underline"
              defaultValue={target.phone_number ?? "N/A"}
              placeholder="전화번호"
              onBlur={(e) => handleUpdatePhoneNumber(target.id, e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={target.active}
                    disabled={loadingIds.has(target.id)}
                    onCheckedChange={(checked) =>
                      handleUpdateActive(target.id, checked)
                    }
                  />
                  <span className="text-sm">
                    {target.active ? "활성화" : "비활성화"}
                  </span>
                </div>
                <hr className="my-2 border-gray-200" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    handleDelete(target.id, target.phone_number ?? "")
                  }
                  disabled={loadingIds.has(target.id)}
                >
                  {loadingIds.has(target.id) ? (
                    <span className="animate-spin w-4 h-4 mr-2">⏳</span>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  삭제
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </li>
      ))}
    </ul>
  );
}
