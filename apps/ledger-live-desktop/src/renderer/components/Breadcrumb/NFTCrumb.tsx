import React, { useCallback, useMemo, memo } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import DropDownSelector, { DropDownItemType } from "~/renderer/components/DropDownSelector";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import IconCheck from "~/renderer/icons/Check";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconAngleUp from "~/renderer/icons/AngleUp";
import { Separator, Item, TextLink, AngleDown, Check } from "./common";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import CollectionName from "~/renderer/components/Nft/CollectionName";
import { ProtoNFT } from "@ledgerhq/types-live";
import { State } from "~/renderer/reducers";
import { useNftCollections } from "~/renderer/hooks/nfts/useNftCollections";

const LabelWithMeta = ({
  item,
  isActive,
}: {
  isActive: boolean;
  item: DropDownItemType<ProtoNFT>;
}) => (
  <Item isActive={isActive}>
    <Text ff={`Inter|${isActive ? "SemiBold" : "Regular"}`} fontSize={4}>
      <CollectionName nft={item?.content} fallback={item?.content?.contract} />
    </Text>
    {isActive && (
      <Check>
        <IconCheck size={14} />
      </Check>
    )}
  </Item>
);

const NFTCrumb = () => {
  const history = useHistory();
  const { id, collectionAddress } = useParams<{ id?: string; collectionAddress?: string }>();
  const account = useSelector((state: State) =>
    id
      ? accountSelector(state, {
          accountId: id,
        })
      : undefined,
  );

  const { collections } = useNftCollections({
    account,
  });

  const items: DropDownItemType<ProtoNFT>[] = useMemo(
    () =>
      collections.map(([contract, nfts]: [string, ProtoNFT[]]) => ({
        key: contract,
        label: contract,
        content: nfts[0],
      })),
    [collections],
  );

  const activeItem: DropDownItemType<ProtoNFT> | undefined | null = useMemo(
    () => items.find(item => item.key === collectionAddress) || items[0],
    [collectionAddress, items],
  );
  const onCollectionSelected = useCallback(
    (item: DropDownItemType<ProtoNFT>) => {
      if (!item) return;
      setTrackingSource("NFT breadcrumb");
      history.push({
        pathname: `/account/${account?.id}/nft-collection/${item.key}`,
      });
    },
    [account?.id, history],
  );
  const onSeeAll = useCallback(() => {
    setTrackingSource("NFT breadcrumb");
    history.push({
      pathname: `/account/${account?.id}/nft-collection`,
    });
  }, [account?.id, history]);
  return (
    <>
      <TextLink>
        <Button onClick={onSeeAll}>{"NFT"}</Button>
      </TextLink>

      {collectionAddress ? (
        <>
          <Separator />
          <DropDownSelector
            items={items}
            controlled
            renderItem={LabelWithMeta}
            onChange={onCollectionSelected}
          >
            {({ isOpen }) => (
              <TextLink>
                <Button>
                  <CollectionName
                    nft={activeItem?.content}
                    fallback={activeItem?.content?.contract}
                  />
                </Button>
                <AngleDown>
                  {isOpen ? <IconAngleUp size={16} /> : <IconAngleDown size={16} />}
                </AngleDown>
              </TextLink>
            )}
          </DropDownSelector>
        </>
      ) : null}
    </>
  );
};
export default memo<{}>(NFTCrumb);
