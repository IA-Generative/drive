import { Item, ItemType } from "@/features/drivers/types";
import {
  FilePreview,
  FilePreviewType,
  MimeCategory,
} from "@gouvfr-lasuite/ui-kit";
import { useTranslation } from "react-i18next";
import { PropsWithChildren, useMemo } from "react";
import posthog from "posthog-js";
import { itemToPreviewFile } from "@/features/explorer/utils/utils";
import { useDownloadItem } from "@/features/items/hooks/useDownloadItem";
import { ItemInfo } from "@/features/items/components/ItemInfo";
import { Button, Tooltip, useModal } from "@gouvfr-lasuite/cunningham-react";
import { ItemShareModal } from "@/features/explorer/components/modals/share/ItemShareModal";
import { openWopiInNewTab } from "@/features/wopi/openWopi";
import { useAuth } from "@/features/auth/Auth";
import { AnonymousCTA } from "../components/anonymous-cta/AnonymousCTA";
import { MyFilesCTA } from "../components/my-files-cta/MyFilesCTA";
import { getItemMimeCategory } from "@/features/explorer/utils/mimeTypes";
import { EnConstructionBadge } from "@/features/mirai/EnConstruction";

// MirAI : sans éditeur en ligne, un document bureautique n'a ni aperçu ni
// édition — seulement « Télécharger ». On le dit au lieu de laisser croire
// que le fichier est cassé.
const OFFICE_CATEGORIES = [
  MimeCategory.DOC,
  MimeCategory.CALC,
  MimeCategory.POWERPOINT,
];

const NoOnlineEditNotice = ({ item }: { item: Item }) => {
  const { t } = useTranslation();
  if (
    item.is_wopi_supported ||
    !OFFICE_CATEGORIES.includes(getItemMimeCategory(item))
  ) {
    return null;
  }
  return (
    <Tooltip content={t("mirai.no_online_edit")}>
      <span
        className="custom-files-preview-no-online-edit"
        role="note"
        tabIndex={0}
        aria-label={t("mirai.no_online_edit")}
      >
        <EnConstructionBadge />
        <span className="custom-files-preview-no-online-edit__label">
          {t("mirai.no_online_edit_short")}
        </span>
      </span>
    </Tooltip>
  );
};

export enum CustomFilesPreviewMode {
  // The actions header will be the default actions header.
  DEFAULT = "default",
  // The actions header will be contextual to the authentication status of the user.
  CONTEXTUAL = "contextual",
}

type CustomFilesPreviewProps = {
  currentItem?: Item;
  items: Item[];
  setPreviewItem?: (item?: Item) => void;
  mode?: CustomFilesPreviewMode;
};

export const CustomFilesPreview = ({
  currentItem,
  items,
  setPreviewItem,
  mode = CustomFilesPreviewMode.DEFAULT,
}: CustomFilesPreviewProps) => {
  const { handleDownloadItem } = useDownloadItem();

  const files = useMemo(() => {
    return items
      .filter((item) => item.type === ItemType.FILE)
      .map(itemToPreviewFile);
  }, [items]);

  const handleClosePreview = () => {
    setPreviewItem?.(undefined);
  };

  const handleChangePreviewItem = (file?: FilePreviewType) => {
    const item = items.find((item) => file?.id === item.id);
    setPreviewItem?.(item);
  };

  return (
    <FilePreview
      isOpen={!!currentItem}
      onClose={handleClosePreview}
      files={files}
      onChangeFile={handleChangePreviewItem}
      handleDownloadFile={() => handleDownloadItem(currentItem)}
      openedFileId={currentItem?.id}
      onFileOpen={(file) =>
        posthog.capture("file_preview_opened", {
          id: file.id,
          size: file.size,
          mimetype: file.mimetype,
        })
      }
      onOpenInEditor={openWopiInNewTab}
      customHeaderActions={(actions) => (
        <CustomFilesPreviewRightHeader currentItem={currentItem} mode={mode}>
          {actions}
        </CustomFilesPreviewRightHeader>
      )}
      sidebarContent={currentItem && <ItemInfo item={currentItem} />}
    />
  );
};

type CustomFilesPreviewRightHeaderProps = {
  currentItem?: Item;
  mode: CustomFilesPreviewMode;
} & PropsWithChildren;

const CustomFilesPreviewRightHeader = ({
  children,
  currentItem,
  mode,
}: CustomFilesPreviewRightHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const shareModal = useModal();

  if (!currentItem) {
    return null;
  }

  return (
    <>
      {mode === CustomFilesPreviewMode.DEFAULT && (
        <>
          <div className="custom-files-preview-right-header">
            <Button variant="tertiary" onClick={shareModal.open}>
              {t("explorer.rightPanel.share")}
            </Button>
          </div>

          {shareModal.isOpen && (
            <ItemShareModal {...shareModal} item={currentItem} />
          )}
        </>
      )}

      <NoOnlineEditNotice item={currentItem} />

      {children}

      {mode === CustomFilesPreviewMode.CONTEXTUAL && (
        <div className="custom-files-preview-right-header">
          {user ? <MyFilesCTA /> : <AnonymousCTA />}
        </div>
      )}
    </>
  );
};
